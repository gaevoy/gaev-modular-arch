using Gaev.Currency.Contracts;
using Gaev.Dashboard.Contracts;
using Gaev.User.Contracts;

namespace Gaev.Dashboard.Impl;

public sealed class DashboardService : IDashboardService
{
    private readonly IUserService _users;
    private readonly ICurrencyService _currency;

    public DashboardService(IUserService users, ICurrencyService currency)
    {
        _users = users;
        _currency = currency;
    }

    public async Task<DashboardDto> GetDashboard()
    {
        var users = await _users.ListUsers();
        var conversion = _currency.Convert(100m, "USD", "EUR");
        var summary = $"100 USD = {conversion.Result} EUR (rate {conversion.Rate})";
        return new DashboardDto(users.Count(), summary);
    }
}
