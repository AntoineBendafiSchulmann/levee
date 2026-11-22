var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Tout ce que le front appelle vit sous /bff. Aucune route de repli n'est déclarée :
// une route /bff inconnue répond donc 404.
var bff = app.MapGroup("/bff");

bff.MapGet("/etat", (IHostEnvironment environnement) => TypedResults.Ok(new EtatBff(
    Service: environnement.ApplicationName,
    Environnement: environnement.EnvironmentName,
    HorodatageUtc: DateTimeOffset.UtcNow)));

app.Run();

internal sealed record EtatBff(string Service, string Environnement, DateTimeOffset HorodatageUtc);
