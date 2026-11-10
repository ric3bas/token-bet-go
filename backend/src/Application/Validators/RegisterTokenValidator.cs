using FluentValidation;
using TokenBet.Application.DTOs;

namespace TokenBet.Application.Validators;

public class RegisterTokenValidator : AbstractValidator<RegisterTokenRequest>
{
    public RegisterTokenValidator()
    {
        RuleFor(x => x.MintAddress)
            .NotEmpty().WithMessage("Mint address é obrigatório.")
            .Length(32, 44).WithMessage("Mint address Solana inválido.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome do token é obrigatório.")
            .MaximumLength(32).WithMessage("Nome do token não pode exceder 32 caracteres.");

        RuleFor(x => x.Symbol)
            .NotEmpty().WithMessage("Símbolo do token é obrigatório.")
            .MaximumLength(10).WithMessage("Símbolo não pode exceder 10 caracteres.");

        RuleFor(x => x.UserWallet)
            .NotEmpty().WithMessage("Carteira do usuário é obrigatória.")
            .Length(32, 44).WithMessage("Endereço de carteira inválido.");

        RuleFor(x => x.TreasuryWallet)
            .NotEmpty().WithMessage("Carteira de tesouraria é obrigatória.");

        RuleFor(x => x.TxSignature)
            .NotEmpty().WithMessage("Assinatura da transação Solana é obrigatória.");

        RuleFor(x => x.BaseFeeSol)
            .GreaterThanOrEqualTo(0.03m).WithMessage("A taxa base mínima é de 0.03 SOL.");
    }
}

