using Dapper;
using TokenBet.Application.Abstractions.Repositories;
using TokenBet.Domain.Entities;

namespace TokenBet.Infrastructure.Repositories;

public class TokenRepository(IUnitOfWork unitOfWork) : DapperRepository(unitOfWork), ITokenRepository
{
    public async Task<Guid> InsertAsync(TokenCreation token, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO tb.token_creations (
                id, mint_address, name, symbol, decimals, initial_supply,
                description, image_uri, metadata_uri, ipfs_hash,
                revoke_mint_authority, revoke_freeze_authority, immutable_metadata,
                user_wallet, treasury_wallet, tx_signature,
                base_fee_sol, revoke_mint_fee_sol, revoke_freeze_fee_sol, total_platform_fee_sol,
                status, network, created_at, updated_at
            ) VALUES (
                @Id, @MintAddress, @Name, @Symbol, @Decimals, @InitialSupply,
                @Description, @ImageUri, @MetadataUri, @IpfsHash,
                @RevokeMintAuthority, @RevokeFreezeAuthority, @ImmutableMetadata,
                @UserWallet, @TreasuryWallet, @TxSignature,
                @BaseFeeSol, @RevokeMintFeeSol, @RevokeFreezeFeeSol, @TotalPlatformFeeSol,
                @Status, @Network, @CreatedAt, @UpdatedAt
            )
            RETURNING id;
            """;

        var command = new CommandDefinition(sql, token, Transaction, cancellationToken: ct);
        return await Connection.ExecuteScalarAsync<Guid>(command);
    }

    public async Task<TokenCreation?> GetByMintAddressAsync(string mintAddress, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id, mint_address AS MintAddress, name, symbol, decimals, initial_supply AS InitialSupply,
                description, image_uri AS ImageUri, metadata_uri AS MetadataUri, ipfs_hash AS IpfsHash,
                revoke_mint_authority AS RevokeMintAuthority, revoke_freeze_authority AS RevokeFreezeAuthority,
                immutable_metadata AS ImmutableMetadata, user_wallet AS UserWallet,
                treasury_wallet AS TreasuryWallet, tx_signature AS TxSignature,
                base_fee_sol AS BaseFeeSol, revoke_mint_fee_sol AS RevokeMintFeeSol,
                revoke_freeze_fee_sol AS RevokeFreezeFeeSol, total_platform_fee_sol AS TotalPlatformFeeSol,
                status, network, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM tb.token_creations
            WHERE mint_address = @MintAddress;
            """;

        var command = new CommandDefinition(sql, new { MintAddress = mintAddress }, Transaction, cancellationToken: ct);
        return await Connection.QuerySingleOrDefaultAsync<TokenCreation>(command);
    }

    public async Task<IEnumerable<TokenCreation>> GetByUserWalletAsync(string userWallet, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id, mint_address AS MintAddress, name, symbol, decimals, initial_supply AS InitialSupply,
                description, image_uri AS ImageUri, metadata_uri AS MetadataUri, ipfs_hash AS IpfsHash,
                revoke_mint_authority AS RevokeMintAuthority, revoke_freeze_authority AS RevokeFreezeAuthority,
                immutable_metadata AS ImmutableMetadata, user_wallet AS UserWallet,
                treasury_wallet AS TreasuryWallet, tx_signature AS TxSignature,
                base_fee_sol AS BaseFeeSol, revoke_mint_fee_sol AS RevokeMintFeeSol,
                revoke_freeze_fee_sol AS RevokeFreezeFeeSol, total_platform_fee_sol AS TotalPlatformFeeSol,
                status, network, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM tb.token_creations
            WHERE user_wallet = @UserWallet
            ORDER BY created_at DESC;
            """;

        var command = new CommandDefinition(sql, new { UserWallet = userWallet }, Transaction, cancellationToken: ct);
        return await Connection.QueryAsync<TokenCreation>(command);
    }

    public async Task<IEnumerable<TokenCreation>> GetRecentTokensAsync(int limit = 50, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                id, mint_address AS MintAddress, name, symbol, decimals, initial_supply AS InitialSupply,
                description, image_uri AS ImageUri, metadata_uri AS MetadataUri, ipfs_hash AS IpfsHash,
                revoke_mint_authority AS RevokeMintAuthority, revoke_freeze_authority AS RevokeFreezeAuthority,
                immutable_metadata AS ImmutableMetadata, user_wallet AS UserWallet,
                treasury_wallet AS TreasuryWallet, tx_signature AS TxSignature,
                base_fee_sol AS BaseFeeSol, revoke_mint_fee_sol AS RevokeMintFeeSol,
                revoke_freeze_fee_sol AS RevokeFreezeFeeSol, total_platform_fee_sol AS TotalPlatformFeeSol,
                status, network, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM tb.token_creations
            ORDER BY created_at DESC
            LIMIT @Limit;
            """;

        var command = new CommandDefinition(sql, new { Limit = limit }, Transaction, cancellationToken: ct);
        return await Connection.QueryAsync<TokenCreation>(command);
    }
}

