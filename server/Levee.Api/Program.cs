using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Everything the front end calls lives under /bff. No fallback route is declared:
// an unknown /bff route therefore answers 404.
var bff = app.MapGroup("/bff");

// The route and the JSON property names below are a public contract (see BffStatus).
bff.MapGet("/etat", (IHostEnvironment environment) => TypedResults.Ok(new BffStatus(
    Service: environment.ApplicationName,
    Environment: environment.EnvironmentName,
    TimestampUtc: DateTimeOffset.UtcNow)));

app.Run();

/// <summary>
/// Body of GET /bff/etat. The C# names are English; the JSON names stay French and are pinned explicitly, because
/// the client (diagnostics page) reads exactly <c>service</c>, <c>environnement</c> and <c>horodatageUtc</c>.
/// </summary>
internal sealed record BffStatus(
    [property: JsonPropertyName("service")] string Service,
    [property: JsonPropertyName("environnement")] string Environment,
    [property: JsonPropertyName("horodatageUtc")] DateTimeOffset TimestampUtc);
