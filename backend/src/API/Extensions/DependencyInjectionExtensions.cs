using System.Data;
using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;
using TokenBet.Application.Abstractions.Repositories;
using TokenBet.Application.Abstractions.Services;
using TokenBet.Application.UseCases.Tokens;
using TokenBet.Application.UseCases.Treasury;
using TokenBet.Application.Validators;
using TokenBet.Infrastructure;
using TokenBet.Infrastructure.Data;
using TokenBet.Infrastructure.Repositories;
using TokenBet.Infrastructure.Services;
using TokenBet.Infrastructure.Services.Auth;

namespace TokenBet.API.Extensions;

public static class DependencyInjectionExtensions
{
    public static IServiceCollection AddCleanArchitecture(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=tokenbet;Username=postgres;Password=postgres;SearchPath=tb,public;";

        // 1. Entity Framework Core (PostgreSQL Code-First)
        services.AddDbContext<TokenBetDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "tb");
            });
        });

        // 2. Dapper & UnitOfWork (para queries ultra rápidas e compatibilidade peca-aki)
        services.AddScoped<IDbConnection>(_ => new NpgsqlConnection(connectionString));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Repositórios Dapper
        services.AddScoped<ITokenRepository, TokenRepository>();
        services.AddScoped<ITreasuryRepository, TreasuryRepository>();

        // 3. Serviços de Autenticação e JWT
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();

        // 4. Serviços de Infraestrutura & Pinata
        services.AddHttpClient<IPinataService, PinataService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddHttpClient(); // Para requisições OAuth do Google

        // 5. Casos de Uso (Application)
        services.AddScoped<UploadMetadataUseCase>();
        services.AddScoped<RegisterTokenUseCase>();
        services.AddScoped<GetTokensByWalletUseCase>();
        services.AddScoped<GetTreasuryStatsUseCase>();

        // 6. Validadores FluentValidation
        services.AddValidatorsFromAssemblyContaining<RegisterTokenValidator>();

        // 7. Configuração de Autenticação JWT Bearer
        var jwtKey = configuration["Jwt:Key"] ?? "TokenBet_Super_Secure_Solana_Platform_Secret_Key_2026_JWT_Key!";
        var issuer = configuration["Jwt:Issuer"] ?? "TokenBetAPI";
        var audience = configuration["Jwt:Audience"] ?? "TokenBetFrontend";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false; // Permite http em dev
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };
        });

        services.AddAuthorization();

        // 8. Segurança Geral - Rate Limiting (Proteção contra DoS e abuso de upload/auth)
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Limite global por IP
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: clientIp,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60, // 60 requisições
                        Window = TimeSpan.FromMinutes(1), // por minuto
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 10
                    });
            });
        });

        // 9. Health Checks
        services.AddScoped<DatabaseHealthCheck>();
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("postgresql");

        return services;
    }

    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "TokenBet Solana Token Creator API",
                Version = "v1",
                Description = "API de alto desempenho para criação de tokens SPL na Solana, autenticação Google OAuth 2.0, JWT, IPFS Pinata e PostgreSQL."
            });

            // Suporte a JWT no Swagger UI
            var securityScheme = new OpenApiSecurityScheme
            {
                Description = "Insira o token JWT no formato: Bearer {seu_token}",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            };

            c.AddSecurityDefinition("Bearer", securityScheme);

            c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
            {
                { new OpenApiSecuritySchemeReference("Bearer"), new List<string>() }
            });
        });

        return services;
    }
}
