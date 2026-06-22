namespace Gaev.Dashboard.Contracts;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboard();
}
