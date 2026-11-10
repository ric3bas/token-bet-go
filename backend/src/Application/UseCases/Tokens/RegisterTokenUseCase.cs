using FluentValidation;
using TokenBet.Application.Abstractions.Repositories;
using TokenBet.Application.DTOs;
using TokenBet.Domain.Entities;
using TokenBet.Infrastructure;

namespace TokenBet.Application.UseCases.Tokens;

public class RegisterTokenUseCase(
    ITokenRepository tokenRepository,
    ITreasuryRepository treasuryRepository,
    IUnitOfWork unitOfWork,
    IValidator<RegisterTokenRequest> validator)
{
    public async Task<TokenResponse> ExecuteAsync(RegisterTokenRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var token = new TokenCreation
        {
            MintAddress = request.MintAddress,
            Name = request.Name,
            Symbol = request.Symbol.ToUpperInvariant(),
            Decimals = request.Decimals,
            InitialSupply = request.InitialSupply,
            Description = request.Description,
            ImageUri = request.ImageUri,
            MetadataUri = request.MetadataUri,
            IpfsHash = request.IpfsHash,
            RevokeMintAuthority = request.RevokeMintAuthority,
            RevokeFreezeAuthority = request.RevokeFreezeAuthority,
            ImmutableMetadata = request.ImmutableMetadata,
            UserWallet = request.UserWallet,
            TreasuryWallet = request.TreasuryWallet,
            TxSignature = request.TxSignature,
            BaseFeeSol = request.BaseFeeSol,
            RevokeMintFeeSol = request.RevokeMintFeeSol,
            RevokeFreezeFeeSol = request.RevokeFreezeFeeSol,
            TotalPlatformFeeSol = request.TotalPlatformFeeSol,
            Status = "Confirmed",
            Network = request.Network
        };

        // Escrita transacional de banco (UnitOfWork)
        await unitOfWork.BeginAsync(ct);
        try
        {
            var tokenId = await tokenRepository.InsertAsync(token, ct);
            token.Id = tokenId;

            // Registra Pagamento Base
            await treasuryRepository.InsertPaymentAsync(new TreasuryPayment
            {
                TokenCreationId = tokenId,
                UserWallet = request.UserWallet,
                TreasuryWallet = request.TreasuryWallet,
                AmountSol = request.BaseFeeSol,
                FeeType = "BaseFee",
                TxSignature = request.TxSignature
            }, ct);

            // Registra Taxa Revoke Mint (se selecionado)
            if (request.RevokeMintAuthority && request.RevokeMintFeeSol > 0)
            {
                await treasuryRepository.InsertPaymentAsync(new TreasuryPayment
                {
                    TokenCreationId = tokenId,
                    UserWallet = request.UserWallet,
                    TreasuryWallet = request.TreasuryWallet,
                    AmountSol = request.RevokeMintFeeSol,
                    FeeType = "RevokeMintFee",
                    TxSignature = request.TxSignature
                }, ct);
            }

            // Registra Taxa Revoke Freeze (se selecionado)
            if (request.RevokeFreezeAuthority && request.RevokeFreezeFeeSol > 0)
            {
                await treasuryRepository.InsertPaymentAsync(new TreasuryPayment
                {
                    TokenCreationId = tokenId,
                    UserWallet = request.UserWallet,
                    TreasuryWallet = request.TreasuryWallet,
                    AmountSol = request.RevokeFreezeFeeSol,
                    FeeType = "RevokeFreezeFee",
                    TxSignature = request.TxSignature
                }, ct);
            }

            await unitOfWork.CommitAsync(ct);
        }
        catch
        {
            await unitOfWork.RollbackAsync(ct);
            throw;
        }

        return new TokenResponse(
            token.Id,
            token.MintAddress,
            token.Name,
            token.Symbol,
            token.Decimals,
            token.InitialSupply,
            token.Description,
            token.ImageUri,
            token.MetadataUri,
            token.RevokeMintAuthority,
            token.RevokeFreezeAuthority,
            token.ImmutableMetadata,
            token.UserWallet,
            token.TxSignature,
            token.TotalPlatformFeeSol,
            token.Status,
            token.Network,
            token.CreatedAt
        );
    }
}

