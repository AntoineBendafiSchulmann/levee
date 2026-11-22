using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

/// <summary>
/// Copie de l'état observable d'une réserve, faite uniquement de valeurs. Elle ne garde aucune
/// référence vers la réserve, ses tentatives ou ses décisions : si l'une d'elles est modifiée
/// après coup, la comparaison avec un nouvel instantané le révèle.
/// </summary>
internal sealed record InstantaneReserve(EnTeteReserve EnTete, IReadOnlyList<InstantaneTentative> Tentatives)
{
    public static InstantaneReserve De(Reserve reserve) => new(
        new EnTeteReserve(
            reserve.Id.Valeur,
            reserve.Emplacement.Plan.Valeur,
            reserve.Emplacement.X,
            reserve.Emplacement.Y,
            reserve.PhotoDuDefaut.Valeur,
            reserve.CreeeLe,
            reserve.Statut,
            reserve.ArtisanAffecte?.Valeur,
            reserve.ACorriger),
        [.. reserve.Tentatives.Select(InstantaneTentative.De)]);

    public static void VerifierInchangee(InstantaneReserve avant, Reserve reserve)
    {
        var apres = De(reserve);

        Assert.Equal(avant.EnTete, apres.EnTete);
        Assert.Equal(avant.Tentatives, apres.Tentatives);
    }
}

internal sealed record EnTeteReserve(
    Guid Id,
    Guid Plan,
    double X,
    double Y,
    Guid PhotoDuDefaut,
    DateTimeOffset CreeeLe,
    StatutReserve Statut,
    Guid? ArtisanAffecte,
    bool ACorriger);

internal sealed record InstantaneTentative(
    int Numero,
    Guid Photo,
    DateTimeOffset SoumiseLe,
    string? Decision,
    DateTimeOffset? DecideeLe,
    string? Motif)
{
    public static InstantaneTentative De(TentativeReprise tentative) => new(
        tentative.Numero,
        tentative.Photo.Valeur,
        tentative.SoumiseLe,
        tentative.Decision?.GetType().Name,
        tentative.Decision?.Le,
        (tentative.Decision as CorrectionDemandee)?.Motif);
}
