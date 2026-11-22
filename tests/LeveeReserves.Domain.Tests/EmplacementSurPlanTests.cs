using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

public class EmplacementSurPlanTests
{
    private static readonly PlanId Plan = Donnees.Emplacement.Plan;

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(0, 1)]
    [InlineData(1, 0)]
    [InlineData(0.5, 0.5)]
    public void Les_coordonnees_de_0_a_1_inclus_sont_acceptees(double x, double y)
    {
        var emplacement = new EmplacementSurPlan(Plan, x, y);

        Assert.Equal(Plan, emplacement.Plan);
        Assert.Equal(x, emplacement.X);
        Assert.Equal(y, emplacement.Y);
    }

    [Theory]
    [InlineData(-0.0001)]
    [InlineData(1.0001)]
    [InlineData(-1)]
    [InlineData(2)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    [InlineData(double.NegativeInfinity)]
    public void Une_coordonnee_hors_de_0_a_1_ou_non_finie_est_refusee(double invalide)
    {
        var refusX = Assert.Throws<RegleMetierException>(() => new EmplacementSurPlan(Plan, invalide, 0.5));
        var refusY = Assert.Throws<RegleMetierException>(() => new EmplacementSurPlan(Plan, 0.5, invalide));

        Assert.Equal(CodeRegle.EmplacementInvalide, refusX.Code);
        Assert.Equal(CodeRegle.EmplacementInvalide, refusY.Code);
    }

    [Fact]
    public void Un_emplacement_sans_plan_renseigne_est_refuse()
    {
        var refus = Assert.Throws<RegleMetierException>(() => new EmplacementSurPlan(default, 0.5, 0.5));

        Assert.Equal(CodeRegle.EmplacementInvalide, refus.Code);
    }

    [Fact]
    public void Deux_emplacements_de_memes_valeurs_sont_egaux()
    {
        Assert.Equal(new EmplacementSurPlan(Plan, 0.25, 0.75), new EmplacementSurPlan(Plan, 0.25, 0.75));
        Assert.NotEqual(new EmplacementSurPlan(Plan, 0.25, 0.75), new EmplacementSurPlan(Plan, 0.75, 0.25));
    }
}
