using TokenBet.Domain.Entities;

namespace TokenBet.Application.Abstractions.Repositories;

public interface ITreasuryRepository
{
    Task InsertPaymentAsync(TreasuryPayment payment, CancellationToken ct = default);
    Task<decimal> GetTotalRevenueSolAsync(CancellationToken ct = default);
    Task<IEnumerable<TreasuryPayment>> GetPaymentsByTreasuryWalletAsync(string treasuryWallet, CancellationToken ct = default);
}

