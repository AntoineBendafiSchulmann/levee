using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

/// <summary>Étape du cycle de vie à laquelle un test veut trouver la réserve.</summary>
public enum Situation
{
    Ouverte,
    Affectee,
    RepriseSoumise,
    ACorriger,
    Levee,
}

public enum Operation
{
    Affecter,
    SoumettreReprise,
    ValiderReprise,
    DemanderCorrection,
}

internal static class Donnees
{
    public const string MotifInitial = "Joint irrégulier";

    public static readonly ArtisanId Artisan = new(Identifiant(100));
    public static readonly ArtisanId AutreArtisan = new(Identifiant(200));
    public static readonly PhotoId PhotoDuDefaut = new(Identifiant(1000));
    public static readonly EmplacementSurPlan Emplacement = new(new PlanId(Identifiant(10)), 0.25, 0.75);

    public static PhotoId Photo(int numero) => new(Identifiant(1000 + numero));

    public static DateTimeOffset Jour(int jour) => new(2026, 1, jour, 9, 0, 0, TimeSpan.Zero);

    public static Reserve ReserveOuverte() =>
        Reserve.Creer(new ReserveId(Identifiant(1)), Emplacement, PhotoDuDefaut, Jour(1));

    /// <summary>
    /// Construit une réserve neuve amenée à la situation demandée par le parcours nominal :
    /// création le jour 1, première reprise le jour 2, décision le jour 3.
    /// </summary>
    public static Reserve ReserveEn(Situation situation)
    {
        var reserve = ReserveOuverte();
        if (situation == Situation.Ouverte)
        {
            return reserve;
        }

        reserve.Affecter(Artisan);
        if (situation == Situation.Affectee)
        {
            return reserve;
        }

        reserve.SoumettreReprise(Artisan, Photo(1), Jour(2));
        switch (situation)
        {
            case Situation.RepriseSoumise:
                break;
            case Situation.ACorriger:
                reserve.DemanderCorrection(MotifInitial, Jour(3));
                break;
            case Situation.Levee:
                reserve.ValiderReprise(Jour(3));
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(situation), situation, null);
        }

        return reserve;
    }

    /// <summary>Exécute l'opération avec des arguments valides, pour n'éprouver que la règle de statut.</summary>
    public static void Executer(Reserve reserve, Operation operation)
    {
        switch (operation)
        {
            case Operation.Affecter:
                reserve.Affecter(Artisan);
                break;
            case Operation.SoumettreReprise:
                reserve.SoumettreReprise(Artisan, Photo(9), Jour(9));
                break;
            case Operation.ValiderReprise:
                reserve.ValiderReprise(Jour(9));
                break;
            case Operation.DemanderCorrection:
                reserve.DemanderCorrection("Motif valide", Jour(9));
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(operation), operation, null);
        }
    }

    private static Guid Identifiant(int numero) => Guid.Parse($"00000000-0000-0000-0000-{numero:D12}");
}
