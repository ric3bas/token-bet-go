using System.Security.Claims;
using TokenBet.Domain.Entities;

namespace TokenBet.Infrastructure.Services.Auth;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

