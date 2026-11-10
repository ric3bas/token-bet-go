using System.Security.Claims;
using System.Text.Json;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using TokenBet.Infrastructure.Services.Auth;

namespace TokenBet.API.Endpoints;

public static class AuthEndpoints
{
    private static void SetRefreshTokenCookie(HttpResponse response, string refreshToken, int expiryDays)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Exige HTTPS em produção
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(expiryDays)
        };
        response.Cookies.Append("refresh_token", refreshToken, cookieOptions);
    }

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        // 1. Iniciar Fluxo OAuth do Google (Redirecionamento)
        group.MapGet("/google", (IConfiguration config) =>
        {
            var clientId = config["Google:ClientId"] ?? "";
            var redirectUri = config["Google:RedirectUri"] ?? "http://localhost:5000/api/auth/callback";
            var scope = Uri.EscapeDataString("openid email profile");

            var googleAuthUrl = $"https://accounts.google.com/o/oauth2/v2/auth" +
                                $"?client_id={clientId}" +
                                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                                $"&response_type=code" +
                                $"&scope={scope}" +
                                $"&access_type=offline" +
                                $"&prompt=consent";

            return Results.Redirect(googleAuthUrl);
        })
        .WithName("GoogleLoginRedirect")
        .WithSummary("Redireciona para o consentimento OAuth 2.0 do Google.");

        // 1.1 Login direto via ID Token (Google Identity Services)
        group.MapPost("/google", async (
            [FromBody] GoogleLoginDto request,
            [FromServices] IAuthService authService,
            IConfiguration config,
            HttpResponse response,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
            {
                return Results.BadRequest(new { error = "IdToken é obrigatório." });
            }

            try
            {
                var clientId = config["Google:ClientId"];
                var validationSettings = new GoogleJsonWebSignature.ValidationSettings();
                if (!string.IsNullOrWhiteSpace(clientId))
                {
                    validationSettings.Audience = new[] { clientId };
                }

                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, validationSettings);
                var result = await authService.ProcessGoogleUserAsync(
                    payload.Subject,
                    payload.Email,
                    payload.Name,
                    payload.Picture,
                    ct
                );

                if (!result.Success || result.User is null)
                {
                    return Results.BadRequest(new { error = result.Error });
                }

                var expiryDays = int.TryParse(config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 7;
                SetRefreshTokenCookie(response, result.RefreshToken!, expiryDays);

                return Results.Ok(new
                {
                    accessToken = result.AccessToken,
                    user = new
                    {
                        id = result.User.Id,
                        email = result.User.Email,
                        name = result.User.Name,
                        walletAddress = result.User.WalletAddress,
                        avatarUrl = result.User.AvatarUrl
                    }
                });
            }
            catch (InvalidJwtException)
            {
                return Results.Unauthorized();
            }
        })
        .WithName("GoogleLoginWithIdToken")
        .WithSummary("Autentica o usuário a partir de um ID Token do Google.");

        // 1.2 Gerar Desafio para Assinatura de Carteira Solana (SIWS)
        group.MapGet("/solana/challenge", ([FromQuery] string wallet, [FromServices] IAuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(wallet))
            {
                return Results.BadRequest(new { error = "O parâmetro wallet é obrigatório." });
            }

            var message = authService.GenerateSolanaChallenge(wallet);
            return Results.Ok(new { message, wallet });
        })
        .WithName("GetSolanaChallenge")
        .WithSummary("Gera o texto de desafio (SIWS) para o usuário assinar com sua carteira Solana.");

        // 1.3 Verificar Assinatura da Carteira Solana e Autenticar
        group.MapPost("/solana/verify", async (
            [FromBody] SolanaLoginDto request,
            [FromServices] IAuthService authService,
            IConfiguration config,
            HttpResponse response,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.WalletAddress) ||
                string.IsNullOrWhiteSpace(request.Signature) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return Results.BadRequest(new { error = "WalletAddress, Signature e Message são obrigatórios." });
            }

            var result = await authService.ProcessSolanaWalletLoginAsync(
                request.WalletAddress,
                request.Signature,
                request.Message,
                ct
            );

            if (!result.Success || result.User is null)
            {
                return Results.BadRequest(new { error = result.Error ?? "Falha na autenticação da carteira." });
            }

            var expiryDays = int.TryParse(config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 7;
            SetRefreshTokenCookie(response, result.RefreshToken!, expiryDays);

            return Results.Ok(new
            {
                accessToken = result.AccessToken,
                user = new
                {
                    id = result.User.Id,
                    email = result.User.Email,
                    name = result.User.Name,
                    walletAddress = result.User.WalletAddress,
                    avatarUrl = result.User.AvatarUrl
                }
            });
        })
        .WithName("SolanaLoginVerify")
        .WithSummary("Valida a assinatura Ed25519 da carteira Solana e emite Access Token + Cookie HttpOnly.");

        // 2. Callback OAuth do Google (Troca code por token e dados do usuário)
        group.MapGet("/callback", async (
            [FromQuery] string? code,
            [FromQuery] string? error,
            [FromServices] IAuthService authService,
            [FromServices] HttpClient httpClient,
            IConfiguration config,
            HttpResponse response,
            CancellationToken ct) =>
        {
            var frontendUrl = config["Frontend:Url"] ?? "http://localhost:3000";

            if (!string.IsNullOrWhiteSpace(error) || string.IsNullOrWhiteSpace(code))
            {
                return Results.Redirect($"{frontendUrl}/auth/callback?error={Uri.EscapeDataString(error ?? "code_missing")}");
            }

            try
            {
                var clientId = config["Google:ClientId"];
                var clientSecret = config["Google:ClientSecret"];
                var redirectUri = config["Google:RedirectUri"] ?? "http://localhost:5000/api/auth/callback";

                // Troca o código pelo access_token / id_token do Google
                var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["code"] = code,
                    ["client_id"] = clientId ?? "",
                    ["client_secret"] = clientSecret ?? "",
                    ["redirect_uri"] = redirectUri,
                    ["grant_type"] = "authorization_code"
                });

                var tokenResponse = await httpClient.PostAsync("https://oauth2.googleapis.com/token", tokenRequest, ct);
                if (!tokenResponse.IsSuccessStatusCode)
                {
                    return Results.Redirect($"{frontendUrl}/auth/callback?error=token_exchange_failed");
                }

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync(ct);
                using var tokenDoc = JsonDocument.Parse(tokenJson);
                var idToken = tokenDoc.RootElement.GetProperty("id_token").GetString();

                // Validação do IdToken
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
                var result = await authService.ProcessGoogleUserAsync(
                    payload.Subject,
                    payload.Email,
                    payload.Name,
                    payload.Picture,
                    ct
                );

                if (!result.Success || result.User is null)
                {
                    return Results.Redirect($"{frontendUrl}/auth/callback?error={Uri.EscapeDataString(result.Error ?? "login_failed")}");
                }

                var expiryDays = int.TryParse(config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 7;
                SetRefreshTokenCookie(response, result.RefreshToken!, expiryDays);

                // Redireciona com o Access Token
                return Results.Redirect($"{frontendUrl}/auth/callback?token={result.AccessToken}");
            }
            catch (Exception ex)
            {
                return Results.Redirect($"{frontendUrl}/auth/callback?error={Uri.EscapeDataString(ex.Message)}");
            }
        })
        .WithName("GoogleAuthCallback")
        .WithSummary("Processa o callback de autorização do Google.");

        // 3. Endpoint de Refresh Token (Lê cookie HttpOnly)
        group.MapPost("/refresh", async (
            HttpRequest request,
            HttpResponse response,
            [FromServices] IAuthService authService,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (!request.Cookies.TryGetValue("refresh_token", out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
            {
                return Results.Unauthorized();
            }

            var result = await authService.RefreshTokenAsync(refreshToken, ct);
            if (!result.Success || result.User is null)
            {
                response.Cookies.Delete("refresh_token");
                return Results.Unauthorized();
            }

            var expiryDays = int.TryParse(config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 7;
            SetRefreshTokenCookie(response, result.RefreshToken!, expiryDays);

            return Results.Ok(new
            {
                accessToken = result.AccessToken,
                user = new
                {
                    id = result.User.Id,
                    email = result.User.Email,
                    name = result.User.Name,
                    walletAddress = result.User.WalletAddress,
                    avatarUrl = result.User.AvatarUrl
                }
            });
        })
        .WithName("RefreshToken")
        .WithSummary("Renova o AccessToken via RefreshToken armazenado no cookie HttpOnly.");

        // 4. Perfil do Usuário Autenticado
        group.MapGet("/me", async (
            ClaimsPrincipal principal,
            [FromServices] IAuthService authService,
            CancellationToken ct) =>
        {
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst("sub")?.Value;

            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var user = await authService.GetUserByIdAsync(userId, ct);
            if (user is null) return Results.NotFound();

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                name = user.Name,
                walletAddress = user.WalletAddress,
                avatarUrl = user.AvatarUrl,
                createdAt = user.CreatedAt
            });
        })
        .RequireAuthorization()
        .WithName("GetCurrentUser")
        .WithSummary("Retorna os dados do usuário autenticado.");

        // 5. Logout
        group.MapPost("/logout", (HttpResponse response) =>
        {
            response.Cookies.Delete("refresh_token");
            return Results.Ok(new { message = "Logout efetuado com sucesso." });
        })
        .WithName("Logout")
        .WithSummary("Remove o cookie HttpOnly de RefreshToken.");

        return app;
    }
}

public record GoogleLoginDto(string IdToken);
public record SolanaLoginDto(string WalletAddress, string Signature, string Message);
