namespace TokenBet.Domain.Entities;

public class Token
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string TokenAddress { get; set; } = string.Empty; // Mint Address da Solana
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public decimal Supply { get; set; }
    public short Decimals { get; set; } = 9;
    public string? MetadataUri { get; set; }
    public string? ImageUri { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Status: indica se o token está com autoridade revogada (True = seguro / revogado)
    public bool Status { get; set; }
    public bool IsMintRevoked { get; set; }
    public bool IsFreezeRevoked { get; set; }
    public bool ImmutableMetadata { get; set; } = true;

    // Navegação
    public User? User { get; set; }
}

