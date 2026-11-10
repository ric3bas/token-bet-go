namespace TokenBet.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Signature { get; set; } = string.Empty; // Hash da Transação na Solana
    public string Type { get; set; } = "Create"; // Create, RevokeMint, RevokeFreeze
    public decimal AmountEarned { get; set; } // Valor em SOL coletado pela empresa (0.03, 0.05, etc.)
    public DateTime Date { get; set; } = DateTime.UtcNow;

    // Navegação
    public User? User { get; set; }
}

