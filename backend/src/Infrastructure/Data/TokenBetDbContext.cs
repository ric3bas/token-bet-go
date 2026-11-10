using Microsoft.EntityFrameworkCore;
using TokenBet.Domain.Entities;

namespace TokenBet.Infrastructure.Data;

public class TokenBetDbContext(DbContextOptions<TokenBetDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Token> Tokens => Set<Token>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Schema dedicado PostgreSQL
        modelBuilder.HasDefaultSchema("tb");

        // 1. Configuração da Entidade User (Suporte Híbrido: Google OAuth e Solana Wallet)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);

            entity.Property(u => u.GoogleId).HasMaxLength(100);
            entity.HasIndex(u => u.GoogleId).IsUnique().HasFilter("google_id IS NOT NULL");

            entity.Property(u => u.WalletAddress).HasMaxLength(44);
            entity.HasIndex(u => u.WalletAddress).IsUnique().HasFilter("wallet_address IS NOT NULL");

            entity.Property(u => u.Email).HasMaxLength(256);
            entity.HasIndex(u => u.Email).IsUnique().HasFilter("email IS NOT NULL");

            entity.Property(u => u.Name).HasMaxLength(150).IsRequired();
            entity.Property(u => u.AvatarUrl).HasMaxLength(500);
            entity.Property(u => u.RefreshToken).HasMaxLength(256);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasMany(u => u.Tokens)
                  .WithOne(t => t.User)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.Transactions)
                  .WithOne(t => t.User)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. Configuração da Entidade Token
        modelBuilder.Entity<Token>(entity =>
        {
            entity.ToTable("tokens");
            entity.HasKey(t => t.Id);

            entity.Property(t => t.TokenAddress).HasMaxLength(44).IsRequired();
            entity.HasIndex(t => t.TokenAddress).IsUnique();

            entity.Property(t => t.Name).HasMaxLength(32).IsRequired();
            entity.Property(t => t.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(t => t.Supply).HasPrecision(38, 0).IsRequired();
            entity.Property(t => t.Decimals).HasDefaultValue((short)9);
            entity.Property(t => t.MetadataUri).HasMaxLength(500);
            entity.Property(t => t.ImageUri).HasMaxLength(500);
            entity.Property(t => t.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasIndex(t => t.UserId);
            entity.HasIndex(t => t.Symbol);
        });

        // 3. Configuração da Entidade Transaction
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("transactions");
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Signature).HasMaxLength(88).IsRequired();
            entity.HasIndex(t => t.Signature).IsUnique();

            entity.Property(t => t.Type).HasMaxLength(30).IsRequired();
            entity.Property(t => t.AmountEarned).HasPrecision(18, 6).IsRequired();
            entity.Property(t => t.Date).HasDefaultValueSql("NOW()");

            entity.HasIndex(t => t.UserId);
            entity.HasIndex(t => t.Type);
        });
    }
}

