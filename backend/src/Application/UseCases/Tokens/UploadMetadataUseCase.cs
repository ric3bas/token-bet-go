using Microsoft.AspNetCore.Http;
using TokenBet.Application.Abstractions.Services;
using TokenBet.Application.DTOs;

namespace TokenBet.Application.UseCases.Tokens;

public class UploadMetadataUseCase(IPinataService pinataService)
{
    public async Task<UploadMetadataResponse> ExecuteAsync(
        IFormFile file,
        string name,
        string symbol,
        string description,
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            throw new ArgumentException("Arquivo de imagem é obrigatório.");

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do token é obrigatório.");

        if (string.IsNullOrWhiteSpace(symbol))
            throw new ArgumentException("Símbolo do token é obrigatório.");

        var cleanSymbol = symbol.Trim().ToUpperInvariant();
        var cleanName = name.Trim();

        // 1. Upload do Arquivo de Imagem para o IPFS
        await using var stream = file.OpenReadStream();
        var imageResult = await pinataService.UploadFileAsync(stream, file.FileName, file.ContentType, ct);

        // 2. Composição do Metadados Metaplex V3
        var metadata = new
        {
            name = cleanName,
            symbol = cleanSymbol,
            description = string.IsNullOrWhiteSpace(description) ? $"{cleanName} token on Solana." : description.Trim(),
            image = imageResult.GatewayUrl,
            attributes = Array.Empty<object>(),
            properties = new
            {
                files = new[]
                {
                    new { uri = imageResult.GatewayUrl, type = file.ContentType }
                },
                category = "image"
            }
        };

        // 3. Upload do Manifesto JSON para o IPFS
        var metadataResult = await pinataService.UploadMetadataJsonAsync(metadata, cleanSymbol, ct);

        return new UploadMetadataResponse(
            Success: true,
            MetadataUri: metadataResult.MetadataUri,
            ImageUri: imageResult.GatewayUrl,
            IpfsHash: metadataResult.IpfsHash,
            Metadata: metadata
        );
    }
}

