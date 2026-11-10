using TokenBet.Domain.Entities;

namespace TokenBet.Infrastructure.Services.Auth;

public record AuthResult(
    bool Success,
    string? AccessToken,
    string? RefreshToken,
    User? User,
    string? Error = null
);

public interface IAuthService
{
    Task<AuthResult> ProcessGoogleUserAsync(string googleId, string email, string name, string? avatarUrl, CancellationToken ct = default);
    string GenerateSolanaChallenge(string walletAddress);
    Task<AuthResult> ProcessSolanaWalletLoginAsync(string walletAddress, string signature, string message, CancellationToken ct = default);
    Task<AuthResult> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<User?> GetUserByIdAsync(Guid userId, CancellationToken ct = default);
}
