using Microsoft.AspNetCore.Mvc;
using TokenBet.Application.DTOs;
using TokenBet.Application.UseCases.Tokens;

namespace TokenBet.API.Endpoints;

public static class TokenEndpoints
{
    public static IEndpointRouteBuilder MapTokenEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api");

        // 1. Endpoint de Upload IPFS (Pinata) protegido por JWT
        group.MapPost("/upload", async (
            HttpRequest request,
            [FromServices] UploadMetadataUseCase useCase,
            CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
            {
                return Results.BadRequest(new { error = "Content-Type deve ser multipart/form-data." });
            }

            var form = await request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file") ?? form.Files.GetFile("image");
            var name = form["name"].ToString();
            var symbol = form["symbol"].ToString();
            var description = form["description"].ToString();

            if (file is null)
            {
                return Results.BadRequest(new { error = "Arquivo de imagem (file) é obrigatório." });
            }

            var result = await useCase.ExecuteAsync(file, name, symbol, description, ct);
            return Results.Ok(result);
        })
        .RequireAuthorization()
        .DisableAntiforgery()
        .WithName("UploadTokenMetadata")
        .WithSummary("Faz upload da logo e gera os metadados Metaplex V3 no IPFS via Pinata (Autenticado por JWT).");

        // 2. Registro do Token emitido após confirmação na Solana
        group.MapPost("/tokens", async (
            [FromBody] RegisterTokenRequest request,
            [FromServices] RegisterTokenUseCase useCase,
            CancellationToken ct) =>
        {
            var result = await useCase.ExecuteAsync(request, ct);
            return Results.Created($"/api/tokens/{result.MintAddress}", result);
        })
        .WithName("RegisterToken")
        .WithSummary("Persiste o token criado e as taxas da plataforma no PostgreSQL.");

        // 3. Consulta de tokens por carteira
        group.MapGet("/tokens/wallet/{address}", async (
            string address,
            [FromServices] GetTokensByWalletUseCase useCase,
            CancellationToken ct) =>
        {
            var tokens = await useCase.ExecuteAsync(address, ct);
            return Results.Ok(tokens);
        })
        .WithName("GetTokensByWallet")
        .WithSummary("Lista todos os tokens criados por uma determinada carteira.");

        return app;
    }
}

