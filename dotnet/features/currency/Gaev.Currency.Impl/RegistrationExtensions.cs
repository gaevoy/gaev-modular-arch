using Gaev.Currency.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Gaev.Currency.Impl;

public static class RegistrationExtensions
{
    public static IServiceCollection AddCurrencyFeature(this IServiceCollection services)
    {
        services.AddSingleton<ICurrencyService, CurrencyService>();
        return services;
    }

    public static WebApplication UseCurrencyFeature(this WebApplication app)
    {
        app.MapGet("/currency/convert", (decimal amount, string from, string to, ICurrencyService svc) =>
            Results.Ok(svc.Convert(amount, from, to)));

        return app;
    }
}
