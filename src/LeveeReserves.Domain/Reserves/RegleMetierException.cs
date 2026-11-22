namespace LeveeReserves.Domain.Reserves;

/// <summary>
/// Code stable d'un refus métier. Les appelants s'appuient sur ce code, pas sur le message :
/// ne pas renommer ni renuméroter une valeur existante.
/// </summary>
public enum CodeRegle
{
    TransitionInterdite = 1,
    ArtisanNonAffecte = 2,
    ArtisanObligatoire = 3,
    PhotoObligatoire = 4,
    MotifObligatoire = 5,
    EmplacementInvalide = 6,
}

/// <summary>Refus d'une opération par une règle métier. La réserve concernée n'a pas été modifiée.</summary>
public sealed class RegleMetierException(CodeRegle code, string message) : Exception(message)
{
    public CodeRegle Code { get; } = code;
}
