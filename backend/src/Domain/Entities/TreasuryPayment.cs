namespace TokenBet.Domain.Entities;

public class TreasuryPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? TokenCreationId { get; set; }
    public string UserWallet { get; set; } = string.Empty;
    public string TreasuryWallet { get; set; } = string.Empty;
    public decimal AmountSol { get; set; }
    public string FeeType { get; set; } = "BaseFee";
    public string TxSignature { get; set; } = string.Empty;
    public DateTime ConfirmedAt { get; set; } = DateTime.UtcNow;
}

