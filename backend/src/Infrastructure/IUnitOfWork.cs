using System.Data;

namespace TokenBet.Infrastructure;

public interface IUnitOfWork : IDisposable
{
    IDbConnection Connection { get; }
    IDbTransaction? Transaction { get; }
    void Begin();
    Task BeginAsync(CancellationToken ct = default);
    void Commit();
    Task CommitAsync(CancellationToken ct = default);
    void Rollback();
    Task RollbackAsync(CancellationToken ct = default);
}

