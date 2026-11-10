namespace TokenBet.Domain.Entities;

public class TokenCreation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string MintAddress { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public short Decimals { get; set; } = 9;
    public decimal InitialSupply { get; set; }
    public string? Description { get; set; }
    public string ImageUri { get; set; } = string.Empty;
    public string MetadataUri { get; set; } = string.Empty;
    public string? IpfsHash { get; set; }

    public bool RevokeMintAuthority { get; set; }
    public bool RevokeFreezeAuthority { get; set; }
    public bool ImmutableMetadata { get; set; } = true;

    public string UserWallet { get; set; } = string.Empty;
    public string TreasuryWallet { get; set; } = string.Empty;
    public string TxSignature { get; set; } = string.Empty;

    public decimal BaseFeeSol { get; set; } = 0.03m;
    public decimal RevokeMintFeeSol { get; set; }
    public decimal RevokeFreezeFeeSol { get; set; }
    public decimal TotalPlatformFeeSol { get; set; }

    public string Status { get; set; } = "Confirmed";
    public string Network { get; set; } = "mainnet-beta";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

