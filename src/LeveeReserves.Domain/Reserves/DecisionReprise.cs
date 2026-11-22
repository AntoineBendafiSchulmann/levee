namespace LeveeReserves.Domain.Reserves;

/// <summary>
/// Décision du conducteur sur une tentative de reprise. Immuable, et créée uniquement par
/// <see cref="Reserve"/>.
/// </summary>
public abstract record DecisionReprise
{
    private protected DecisionReprise(DateTimeOffset le) => Le = le;

    public DateTimeOffset Le { get; }
}

public sealed record RepriseValidee : DecisionReprise
{
    internal RepriseValidee(DateTimeOffset le)
        : base(le)
    {
    }
}

public sealed record CorrectionDemandee : DecisionReprise
{
    internal CorrectionDemandee(DateTimeOffset le, string motif)
        : base(le) => Motif = motif;

    public string Motif { get; }
}
