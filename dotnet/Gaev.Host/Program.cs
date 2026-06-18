using Gaev.Currency.Impl;
using Gaev.Dashboard.Impl;
using Gaev.User.Impl;

var builder = WebApplication.CreateBuilder(args);
builder.Services
    // Add the features to the service collection
    .AddUserFeature()
    .AddCurrencyFeature()
    .AddDashboardFeature()
    .AddEndpointsApiExplorer()
    .AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
// Use the features in the application pipeline
app.UseUserFeature();
app.UseCurrencyFeature();
app.UseDashboardFeature();
app.Run();
