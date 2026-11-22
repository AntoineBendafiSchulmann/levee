namespace LeveeReserves.Domain.Reserves;

/// <summary>
/// Position d'une réserve sur un plan, en coordonnées relatives au plan : l'origine est en haut
/// à gauche, X croît vers la droite et Y vers le bas. Chaque coordonnée va de 0 à 1 inclus,
/// ce qui la rend indépendante de la taille d'affichage du plan.
/// </summary>
public sealed record EmplacementSurPlan
{
    public EmplacementSurPlan(PlanId plan, double x, double y)
    {
        if (plan == default)
        {
            throw new RegleMetierException(
                CodeRegle.EmplacementInvalide,
                "L'emplacement doit désigner un plan.");
        }

        if (!EstCoordonneeRelative(x) || !EstCoordonneeRelative(y))
        {
            throw new RegleMetierException(
                CodeRegle.EmplacementInvalide,
                "Les coordonnées de l'emplacement doivent être comprises entre 0 et 1 inclus.");
        }

        Plan = plan;
        X = x;
        Y = y;
    }

    public PlanId Plan { get; }

    public double X { get; }

    public double Y { get; }

    private static bool EstCoordonneeRelative(double valeur) =>
        double.IsFinite(valeur) && valeur is >= 0 and <= 1;
}
