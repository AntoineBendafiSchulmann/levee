namespace LeveeReserves.Domain.Reserves;

/// <summary>
/// Une reprise soumise par l'artisan, avec sa photo et la décision qu'elle a reçue. Immuable, et
/// créée uniquement par <see cref="Reserve"/>.
/// </summary>
public sealed record TentativeReprise
{
    internal TentativeReprise(int numero, PhotoId photo, DateTimeOffset soumiseLe, DecisionReprise? decision)
    {
        Numero = numero;
        Photo = photo;
        SoumiseLe = soumiseLe;
        Decision = decision;
    }

    /// <summary>Rang de la tentative pour cette réserve, à partir de 1.</summary>
    public int Numero { get; }

    public PhotoId Photo { get; }

    public DateTimeOffset SoumiseLe { get; }

    /// <summary>Absente tant que le conducteur n'a pas tranché.</summary>
    public DecisionReprise? Decision { get; }

    internal TentativeReprise Avec(DecisionReprise decision) => new(Numero, Photo, SoumiseLe, decision);
}
