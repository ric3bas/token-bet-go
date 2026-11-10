using Dapper;
using TokenBet.Application.Abstractions.Repositories;
using TokenBet.Domain.Entities;

namespace TokenBet.Infrastructure.Repositories;

public class TreasuryRepository(IUnitOfWork unitOfWork) : DapperRepository(unitOfWork), ITreasuryRepository
{
    public async Task InsertPaymentAsync(TreasuryPayment payment, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO tb.treasury_payments (
                id, token_creation_id, user_wallet, treasury_wallet,
                amount_sol, fee_type, tx_signature, confirmed_at
            ) VALUES (
                @Id, @TokenCreationId, @UserWallet, @TreasuryWallet,
                @AmountSol, @FeeType, @TxSignature, @ConfirmedAt
            );
            """;

        var command = new CommandDefinition(sql, payment, Transaction, cancellationToken: ct);
        await Connection.ExecuteAsync(command);
    }

    public async Task<decimal> GetTotalRevenueSolAsync(CancellationToken ct = default)
    {
        const string sql = "SELECT COALESCE(SUM(amount_sol), 0) FROM tb.treasury_payments;";
        var command = new CommandDefinition(sql, cancellationToken: ct);
        return await Connection.ExecuteScalarAsync<decimal>(command);
    }

    public async Task<IEnumerable<TreasuryPayment>> GetPaymentsByTreasuryWalletAsync(string treasuryWallet, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id, token_creation_id AS TokenCreationId, user_wallet AS UserWallet,
                treasury_wallet AS TreasuryWallet, amount_sol AS AmountSol,
                fee_type AS FeeType, tx_signature AS TxSignature, confirmed_at AS ConfirmedAt
            FROM tb.treasury_payments
            WHERE treasury_wallet = @TreasuryWallet
            ORDER BY confirmed_at DESC;
            """;

        var command = new CommandDefinition(sql, new { TreasuryWallet = treasuryWallet }, Transaction, cancellationToken: ct);
        return await Connection.QueryAsync<TreasuryPayment>(command);
    }
}

