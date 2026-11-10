using System.Data;
using Dapper;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TokenBet.Infrastructure.Services;

public class DatabaseHealthCheck(IDbConnection connection) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            if (connection.State != ConnectionState.Open)
                connection.Open();

            await connection.ExecuteScalarAsync<int>(new CommandDefinition("SELECT 1;", cancellationToken: cancellationToken));
            return HealthCheckResult.Healthy("PostgreSQL está operacional.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Falha ao comunicar com o PostgreSQL.", ex);
        }
    }
}

