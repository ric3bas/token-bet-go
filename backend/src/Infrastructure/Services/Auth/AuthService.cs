using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TokenBet.Domain.Entities;
using TokenBet.Infrastructure.Data;

namespace TokenBet.Infrastructure.Services.Auth;

public class AuthService(
    TokenBetDbContext dbContext,
    IJwtService jwtService,
    IConfiguration configuration,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<AuthResult> ProcessGoogleUserAsync(
        string googleId,
        string email,
        string name,
        string? avatarUrl,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(googleId) || string.IsNullOrWhiteSpace(email))
        {
            return new AuthResult(false, null, null, null, "Dados do Google inválidos (GoogleId ou Email ausente).");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();

        // 1. Busca usuário existente pelo GoogleId ou Email
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == normalizedEmail, ct);

        if (user is null)
        {
            user = new User
            {
                GoogleId = googleId,
                Email = normalizedEmail,
                Name = string.IsNullOrWhiteSpace(name) ? normalizedEmail.Split('@')[0] : name.Trim(),
                AvatarUrl = avatarUrl,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(user);
        }
        else
        {
            // Atualiza dados de perfil mais recentes
            user.GoogleId = googleId;
            if (!string.IsNullOrWhiteSpace(name)) user.Name = name.Trim();
            if (!string.IsNullOrWhiteSpace(avatarUrl)) user.AvatarUrl = avatarUrl;
        }

        // 2. Geração de Tokens
        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();
        var refreshExpiryDays = int.TryParse(configuration["Jwt:RefreshTokenExpiryDays"], out var days) ? days : 7;

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshExpiryDays);

        await dbContext.SaveChangesAsync(ct);
        logger.LogInformation("Login Google efetuado com sucesso para o usuário {Email} ({UserId}).", user.Email, user.Id);

        return new AuthResult(true, accessToken, refreshToken, user);
    }

    public string GenerateSolanaChallenge(string walletAddress)
    {
        var nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var timestamp = DateTime.UtcNow.ToString("o");
        return $"TokenBet wants you to sign in with your Solana account:\n{walletAddress}\n\nSign in to TokenBet to manage and create Solana tokens with Zero Platform Fee risk.\n\nURI: https://tokenbet.io\nVersion: 1\nNonce: {nonce}\nIssued At: {timestamp}";
    }

    public async Task<AuthResult> ProcessSolanaWalletLoginAsync(
        string walletAddress,
        string signature,
        string message,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(walletAddress) || string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(message))
        {
            return new AuthResult(false, null, null, null, "Parâmetros de autenticação Solana incompletos.");
        }

        // Validação da mensagem
        if (!message.Contains(walletAddress))
        {
            return new AuthResult(false, null, null, null, "A mensagem de autenticação não corresponde ao endereço da carteira.");
        }

        // Validação criptográfica Ed25519
        var isValid = SolanaSignatureVerifier.VerifySignature(walletAddress, signature, message);
        if (!isValid)
        {
            logger.LogWarning("Falha na validação da assinatura Solana para a carteira {WalletAddress}.", walletAddress);
            return new AuthResult(false, null, null, null, "Assinatura digital inválida.");
        }

        // Busca ou cria o usuário pela carteira
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.WalletAddress == walletAddress, ct);
        if (user is null)
        {
            var shortWallet = walletAddress.Length > 8 
                ? $"{walletAddress[..4]}...{walletAddress[^4..]}" 
                : walletAddress;

            user = new User
            {
                WalletAddress = walletAddress,
                Name = shortWallet,
                Email = $"{walletAddress[..Math.Min(8, walletAddress.Length)].ToLowerInvariant()}@solana.wallet",
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(user);
        }

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();
        var refreshExpiryDays = int.TryParse(configuration["Jwt:RefreshTokenExpiryDays"], out var days) ? days : 7;

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshExpiryDays);

        await dbContext.SaveChangesAsync(ct);
        logger.LogInformation("Login Solana efetuado com sucesso para a carteira {WalletAddress} ({UserId}).", walletAddress, user.Id);

        return new AuthResult(true, accessToken, refreshToken, user);
    }

    public async Task<AuthResult> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return new AuthResult(false, null, null, null, "Refresh Token ausente.");
        }

        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

        if (user is null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return new AuthResult(false, null, null, null, "Refresh Token inválido ou expirado.");
        }

        // Rotação segura de Refresh Token
        var newAccessToken = jwtService.GenerateAccessToken(user);
        var newRefreshToken = jwtService.GenerateRefreshToken();
        var refreshExpiryDays = int.TryParse(configuration["Jwt:RefreshTokenExpiryDays"], out var days) ? days : 7;

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshExpiryDays);

        await dbContext.SaveChangesAsync(ct);
        logger.LogInformation("Sessão renovada via Refresh Token para o usuário {UserId}.", user.Id);

        return new AuthResult(true, newAccessToken, newRefreshToken, user);
    }

    public async Task<User?> GetUserByIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
    }
}
