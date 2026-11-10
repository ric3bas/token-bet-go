using Serilog;
using TokenBet.API.Endpoints;
using TokenBet.API.Extensions;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Iniciando TokenBet Solana Token Creator Backend (.NET 10 / Clean Architecture)...");

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) =>
    {
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console();
    });

    // CORS configurável e restrito para o Frontend em Produção
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:3000", "https://tokenbet.io", "https://app.tokenbet.io" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Necessário para cookies HttpOnly de RefreshToken
        });
    });

    // Injeção de Dependências - Clean Architecture, PostgreSQL, Auth & Pinata
    builder.Services.AddCleanArchitecture(builder.Configuration);

    // Swagger com suporte a Bearer JWT
    builder.Services.AddSwaggerDocumentation();

    var app = builder.Build();

    app.UseCors("AllowFrontend");

    // Ativa Rate Limiting global
    app.UseRateLimiter();

    // Autenticação e Autorização JWT
    app.UseAuthentication();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment() || true)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "TokenBet API v1");
            c.RoutePrefix = "swagger";
        });
    }

    // Health Check Endpoint
    app.MapHealthChecks("/health");

    // Registro das Minimal APIs
    app.MapAuthEndpoints();
    app.MapTokenEndpoints();
    app.MapTreasuryEndpoints();

    app.MapGet("/", () => Results.Ok(new
    {
        service = "TokenBet Solana Token Creator API",
        status = "Online",
        version = "1.0.0",
        docs = "/swagger"
    }));

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Erro fatal durante a inicialização da aplicação.");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
