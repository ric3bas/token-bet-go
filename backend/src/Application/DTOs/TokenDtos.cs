namespace TokenBet.Application.DTOs;

public record UploadMetadataResponse(
    bool Success,
    string MetadataUri,
    string ImageUri,
    string IpfsHash,
    object Metadata
);

public record RegisterTokenRequest(
    string MintAddress,
    string Name,
    string Symbol,
    short Decimals,
    decimal InitialSupply,
    string? Description,
    string ImageUri,
    string MetadataUri,
    string? IpfsHash,
    bool RevokeMintAuthority,
    bool RevokeFreezeAuthority,
    bool ImmutableMetadata,
    string UserWallet,
    string TreasuryWallet,
    string TxSignature,
    decimal BaseFeeSol,
    decimal RevokeMintFeeSol,
    decimal RevokeFreezeFeeSol,
    decimal TotalPlatformFeeSol,
    string Network = "mainnet-beta"
);

public record TokenResponse(
    Guid Id,
    string MintAddress,
    string Name,
    string Symbol,
    short Decimals,
    decimal InitialSupply,
    string? Description,
    string ImageUri,
    string MetadataUri,
    bool RevokeMintAuthority,
    bool RevokeFreezeAuthority,
    bool ImmutableMetadata,
    string UserWallet,
    string TxSignature,
    decimal TotalPlatformFeeSol,
    string Status,
    string Network,
    DateTime CreatedAt
);

public record TreasuryStatsResponse(
    decimal TotalRevenueSol,
    int TotalTokensCreated,
    string TreasuryWallet
);

