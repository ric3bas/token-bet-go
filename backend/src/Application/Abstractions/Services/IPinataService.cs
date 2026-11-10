namespace TokenBet.Application.Abstractions.Services;

public record PinataUploadResult(
    string IpfsHash,
    string GatewayUrl,
    string MetadataUri,
    long PinSize
);

public interface IPinataService
{
    Task<PinataUploadResult> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task<PinataUploadResult> UploadMetadataJsonAsync(object metadata, string tokenSymbol, CancellationToken ct = default);
}

