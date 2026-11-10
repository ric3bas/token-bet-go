using Microsoft.Extensions.Configuration;
using TokenBet.Application.Abstractions.Repositories;
using TokenBet.Application.DTOs;

namespace TokenBet.Application.UseCases.Treasury;

public class GetTreasuryStatsUseCase(ITreasuryRepository treasuryRepository, ITokenRepository tokenRepository, IConfiguration configuration)
{
    public async Task<TreasuryStatsResponse> ExecuteAsync(CancellationToken ct = default)
    {
        var totalRevenue = await treasuryRepository.GetTotalRevenueSolAsync(ct);
        var recentTokens = await tokenRepository.GetRecentTokensAsync(1000, ct);
        var treasuryWallet = configuration["Treasury:Wallet"] 
            ?? configuration["NEXT_PUBLIC_TREASURY_WALLET"] 
            ?? "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

        return new TreasuryStatsResponse(
            TotalRevenueSol: totalRevenue,
            TotalTokensCreated: recentTokens.Count(),
            TreasuryWallet: treasuryWallet
        );
    }
}

