using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TokenBet.Application.Abstractions.Services;

namespace TokenBet.Infrastructure.Services;

public class PinataService(HttpClient httpClient, IConfiguration configuration, ILogger<PinataService> logger) : IPinataService
{
    private const string PinFileEndpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    private const string PinJsonEndpoint = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
    private const string DefaultGateway = "https://gateway.pinata.cloud/ipfs";

    private void ApplyAuthHeaders(HttpRequestMessage request)
    {
        var jwt = configuration["Pinata:Jwt"]?.Trim() ?? configuration["PINATA_JWT"]?.Trim();
        var apiKey = configuration["Pinata:ApiKey"]?.Trim() ?? configuration["PINATA_API_KEY"]?.Trim();
        var secretKey = configuration["Pinata:SecretApiKey"]?.Trim() ?? configuration["PINATA_SECRET_API_KEY"]?.Trim();

        if (!string.IsNullOrWhiteSpace(jwt))
        {
            var cleanJwt = jwt.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? jwt[7..].Trim()
                : jwt;
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cleanJwt);
            return;
        }

        if (!string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(secretKey))
        {
            request.Headers.Add("pinata_api_key", apiKey);
            request.Headers.Add("pinata_secret_api_key", secretKey);
            return;
        }

        logger.LogWarning("[PinataService] Chaves da Pinata não configuradas. Operando em modo de simulação/desenvolvimento.");
    }

    private string BuildGatewayUrl(string ipfsHash)
    {
        var rawGateway = configuration["Pinata:GatewayUrl"]?.Trim()
            ?? configuration["PINATA_GATEWAY_URL"]?.Trim()
            ?? DefaultGateway;
        var cleanGateway = rawGateway.TrimEnd('/');
        var cleanHash = ipfsHash.Replace("ipfs://", "").Trim();

        return cleanGateway.Contains("/ipfs")
            ? $"{cleanGateway}/{cleanHash}"
            : $"{cleanGateway}/ipfs/{cleanHash}";
    }

    public async Task<PinataUploadResult> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var jwt = configuration["Pinata:Jwt"] ?? configuration["PINATA_JWT"];
        var apiKey = configuration["Pinata:ApiKey"] ?? configuration["PINATA_API_KEY"];

        // Modo fallback caso não haja credenciais da Pinata configuradas
        if (string.IsNullOrWhiteSpace(jwt) && string.IsNullOrWhiteSpace(apiKey))
        {
            var mockHash = $"bafkrei{Guid.NewGuid():N}";
            var mockUrl = "https://raw.githubusercontent.com/solana-developers/media/main/icons/tokens/spl-token.png";
            return new PinataUploadResult(mockHash, mockUrl, mockUrl, 1024);
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, PinFileEndpoint);
        ApplyAuthHeaders(request);

        using var content = new MultipartFormDataContent();
        var streamContent = new StreamContent(fileStream);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);
        content.Add(streamContent, "file", fileName);

        var pinataMetadata = JsonSerializer.Serialize(new { name = fileName });
        content.Add(new StringContent(pinataMetadata, Encoding.UTF8, "application/json"), "pinataMetadata");

        var pinataOptions = JsonSerializer.Serialize(new { cidVersion = 1 });
        content.Add(new StringContent(pinataOptions, Encoding.UTF8, "application/json"), "pinataOptions");

        request.Content = content;

        var response = await httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var responseString = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(responseString);
        var ipfsHash = doc.RootElement.GetProperty("IpfsHash").GetString() ?? throw new InvalidOperationException("IpfsHash ausente.");
        var pinSize = doc.RootElement.TryGetProperty("PinSize", out var sizeProp) ? sizeProp.GetInt64() : 0;

        var gatewayUrl = BuildGatewayUrl(ipfsHash);
        return new PinataUploadResult(ipfsHash, gatewayUrl, gatewayUrl, pinSize);
    }

    public async Task<PinataUploadResult> UploadMetadataJsonAsync(object metadata, string tokenSymbol, CancellationToken ct = default)
    {
        var jwt = configuration["Pinata:Jwt"] ?? configuration["PINATA_JWT"];
        var apiKey = configuration["Pinata:ApiKey"] ?? configuration["PINATA_API_KEY"];

        // Modo fallback caso não haja credenciais da Pinata configuradas
        if (string.IsNullOrWhiteSpace(jwt) && string.IsNullOrWhiteSpace(apiKey))
        {
            var mockHash = $"bafkrei{Guid.NewGuid():N}";
            var mockMetadataUrl = "https://raw.githubusercontent.com/solana-developers/media/main/icons/tokens/spl-token.json";
            return new PinataUploadResult(mockHash, mockMetadataUrl, mockMetadataUrl, 512);
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, PinJsonEndpoint);
        ApplyAuthHeaders(request);

        var payload = new
        {
            pinataContent = metadata,
            pinataMetadata = new { name = $"{tokenSymbol.ToLowerInvariant()}-metadata.json" },
            pinataOptions = new { cidVersion = 1 }
        };

        var json = JsonSerializer.Serialize(payload);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var responseString = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(responseString);
        var ipfsHash = doc.RootElement.GetProperty("IpfsHash").GetString() ?? throw new InvalidOperationException("IpfsHash ausente.");
        var pinSize = doc.RootElement.TryGetProperty("PinSize", out var sizeProp) ? sizeProp.GetInt64() : 0;

        var gatewayUrl = BuildGatewayUrl(ipfsHash);
        return new PinataUploadResult(ipfsHash, gatewayUrl, gatewayUrl, pinSize);
    }
}

