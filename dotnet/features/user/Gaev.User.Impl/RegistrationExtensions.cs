using Gaev.User.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Gaev.User.Impl;

public static class RegistrationExtensions
{
    public static IServiceCollection AddUserFeature(this IServiceCollection services)
    {
        services.AddSingleton<IUserService, UserService>();
        return services;
    }

    public static WebApplication UseUserFeature(this WebApplication app)
    {
        app.MapGet("/users", async (IUserService svc) =>
            Results.Ok(await svc.ListUsers()));

        app.MapGet("/users/{id:guid}", async (Guid id, IUserService svc) =>
            await svc.GetUser(id) is { } user ? Results.Ok(user) : Results.NotFound());

        app.MapPost("/users", async (CreateUserRequest req, IUserService svc) =>
        {
            var user = await svc.CreateUser(req);
            return Results.Created($"/users/{user.Id}", user);
        });

        return app;
    }
}
