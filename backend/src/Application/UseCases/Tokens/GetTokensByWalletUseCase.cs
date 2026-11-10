using TokenBet.Application.Abstractions.Repositories;
using TokenBet.Application.DTOs;

namespace TokenBet.Application.UseCases.Tokens;

public class GetTokensByWalletUseCase(ITokenRepository tokenRepository)
{
    public async Task<IEnumerable<TokenResponse>> ExecuteAsync(string walletAddress, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(walletAddress))
            return Enumerable.Empty<TokenResponse>();

        var tokens = await tokenRepository.GetByUserWalletAsync(walletAddress.Trim(), ct);
        return tokens.Select(t => new TokenResponse(
            t.Id,
            t.MintAddress,
            t.Name,
            t.Symbol,
            t.Decimals,
            t.InitialSupply,
            t.Description,
            t.ImageUri,
            t.MetadataUri,
            t.RevokeMintAuthority,
            t.RevokeFreezeAuthority,
            t.ImmutableMetadata,
            t.UserWallet,
            t.TxSignature,
            t.TotalPlatformFeeSol,
            t.Status,
            t.Network,
            t.CreatedAt
        ));
    }
}

