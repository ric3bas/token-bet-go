using Microsoft.AspNetCore.Mvc;
using TokenBet.Application.UseCases.Treasury;

namespace TokenBet.API.Endpoints;

public static class TreasuryEndpoints
{
    public static IEndpointRouteBuilder MapTreasuryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/treasury");

        group.MapGet("/stats", async (
            [FromServices] GetTreasuryStatsUseCase useCase,
            CancellationToken ct) =>
        {
            var stats = await useCase.ExecuteAsync(ct);
            return Results.Ok(stats);
        })
        .WithName("GetTreasuryStats")
        .WithSummary("Retorna o total de SOL arrecadado pela plataforma e métricas de volume.");

        return app;
    }
}

