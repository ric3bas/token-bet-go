using System.Data;
using System.Data.Common;

namespace TokenBet.Infrastructure;

public class UnitOfWork(IDbConnection connection) : IUnitOfWork
{
    public IDbConnection Connection { get; private set; } = connection;
    public IDbTransaction? Transaction { get; private set; }

    private DbConnection AsyncConnection =>
        Connection as DbConnection
        ?? throw new NotSupportedException("A conexão atual não suporta operações assíncronas de transação.");

    public void Begin()
    {
        if (Transaction is not null)
            throw new InvalidOperationException("Uma transação já foi iniciada neste escopo.");

        if (Connection.State != ConnectionState.Open)
            Connection.Open();
        Transaction = Connection.BeginTransaction();
    }

    public async Task BeginAsync(CancellationToken ct = default)
    {
        if (Transaction is not null)
            throw new InvalidOperationException("Uma transação já foi iniciada neste escopo.");

        if (Connection.State != ConnectionState.Open)
            await AsyncConnection.OpenAsync(ct);

        Transaction = await AsyncConnection.BeginTransactionAsync(ct);
    }

    public void Commit()
    {
        Transaction?.Commit();
        Transaction?.Dispose();
        Transaction = null;
    }

    public async Task CommitAsync(CancellationToken ct = default)
    {
        if (Transaction is DbTransaction dbTransaction)
        {
            await dbTransaction.CommitAsync(ct);
            await dbTransaction.DisposeAsync();
        }
        else
        {
            Transaction?.Commit();
            Transaction?.Dispose();
        }
        Transaction = null;
    }

    public void Rollback()
    {
        Transaction?.Rollback();
        Transaction?.Dispose();
        Transaction = null;
    }

    public async Task RollbackAsync(CancellationToken ct = default)
    {
        if (Transaction is DbTransaction dbTransaction)
        {
            await dbTransaction.RollbackAsync(ct);
            await dbTransaction.DisposeAsync();
        }
        else
        {
            Transaction?.Rollback();
            Transaction?.Dispose();
        }
        Transaction = null;
    }

    public void Dispose()
    {
        Transaction?.Dispose();
        Connection?.Dispose();
        GC.SuppressFinalize(this);
    }
}

