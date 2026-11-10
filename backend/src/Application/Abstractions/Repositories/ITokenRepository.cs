using TokenBet.Domain.Entities;

namespace TokenBet.Application.Abstractions.Repositories;

public interface ITokenRepository
{
    Task<Guid> InsertAsync(TokenCreation token, CancellationToken ct = default);
    Task<TokenCreation?> GetByMintAddressAsync(string mintAddress, CancellationToken ct = default);
    Task<IEnumerable<TokenCreation>> GetByUserWalletAsync(string userWallet, CancellationToken ct = default);
    Task<IEnumerable<TokenCreation>> GetRecentTokensAsync(int limit = 50, CancellationToken ct = default);
}

