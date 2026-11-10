using System.Data;

namespace TokenBet.Infrastructure;

public abstract class DapperRepository(IUnitOfWork unitOfWork)
{
    protected readonly IUnitOfWork _unitOfWork = unitOfWork;
    protected IDbConnection Connection => _unitOfWork.Connection;
    protected IDbTransaction? Transaction => _unitOfWork.Transaction;
}

