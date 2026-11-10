namespace TokenBet.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Autenticação Híbrida: Google OAuth e/ou Solana Wallet
    public string? GoogleId { get; set; }
    public string? WalletAddress { get; set; }
    
    public string? Email { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Refresh Token para renovação segura de sessão
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Relacionamentos
    public ICollection<Token> Tokens { get; set; } = new List<Token>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
