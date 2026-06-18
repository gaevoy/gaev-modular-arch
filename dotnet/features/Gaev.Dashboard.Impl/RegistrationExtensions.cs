using Gaev.Dashboard.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Gaev.Dashboard.Impl;

public static class RegistrationExtensions
{
    public static IServiceCollection AddDashboardFeature(this IServiceCollection services)
    {
        services.AddSingleton<IDashboardService, DashboardService>();
        return services;
    }

    public static WebApplication UseDashboardFeature(this WebApplication app)
    {
        app.MapGet("/dashboard", async (IDashboardService svc) =>
            Results.Ok(await svc.GetDashboard()));

        return app;
    }
}
