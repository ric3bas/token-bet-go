using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TokenBet.Domain.Entities;

namespace TokenBet.Infrastructure.Services.Auth;

public class JwtService(IConfiguration configuration) : IJwtService
{
    public string GenerateAccessToken(User user)
    {
        var jwtKey = configuration["Jwt:Key"] ?? "TokenBet_Super_Secure_Solana_Platform_Secret_Key_2026_JWT_Key!";
        var issuer = configuration["Jwt:Issuer"] ?? "TokenBetAPI";
        var audience = configuration["Jwt:Audience"] ?? "TokenBetFrontend";
        var expiryMinutes = int.TryParse(configuration["Jwt:AccessTokenExpiryMinutes"], out var min) ? min : 15;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Name, user.Name ?? "Anonymous User"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            claims.Add(new Claim(JwtRegisteredClaimNames.Email, user.Email));
        }

        if (!string.IsNullOrWhiteSpace(user.GoogleId))
        {
            claims.Add(new Claim("google_id", user.GoogleId));
        }

        if (!string.IsNullOrWhiteSpace(user.WalletAddress))
        {
            claims.Add(new Claim("wallet_address", user.WalletAddress));
        }

        if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
        {
            claims.Add(new Claim("avatar_url", user.AvatarUrl));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var jwtKey = configuration["Jwt:Key"] ?? "TokenBet_Super_Secure_Solana_Platform_Secret_Key_2026_JWT_Key!";
        var issuer = configuration["Jwt:Issuer"] ?? "TokenBetAPI";
        var audience = configuration["Jwt:Audience"] ?? "TokenBetFrontend";

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = false // Permite ler claims mesmo que tenha acabado de expirar para o fluxo de refresh
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}

