using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

public class DecisionRepriseTests
{
    [Fact]
    public void Valider_la_reprise_leve_la_reserve_et_conserve_la_decision_datee()
    {
        var reserve = Donnees.ReserveEn(Situation.RepriseSoumise);

        reserve.ValiderReprise(Donnees.Jour(3));

        Assert.Equal(StatutReserve.Levee, reserve.Statut);
        Assert.False(reserve.ACorriger);
        var tentative = Assert.Single(reserve.Tentatives);
        var decision = Assert.IsType<RepriseValidee>(tentative.Decision);
        Assert.Equal(Donnees.Jour(3), decision.Le);
        Assert.Equal(Donnees.Photo(1), tentative.Photo);
    }

    [Fact]
    public void Demander_une_correction_renvoie_la_reserve_a_l_artisan_avec_ce_qu_il_doit_retrouver()
    {
        var reserve = Donnees.ReserveEn(Situation.RepriseSoumise);

        reserve.DemanderCorrection("Joint irrégulier", Donnees.Jour(3));

        Assert.Equal(StatutReserve.Affectee, reserve.Statut);
        Assert.True(reserve.ACorriger);
        Assert.Equal(Donnees.Artisan, reserve.ArtisanAffecte);

        // Ce que l'artisan retrouve : le motif, la date, la photo initiale et celle de la tentative.
        var tentative = Assert.Single(reserve.Tentatives);
        var correction = Assert.IsType<CorrectionDemandee>(tentative.Decision);
        Assert.Equal("Joint irrégulier", correction.Motif);
        Assert.Equal(Donnees.Jour(3), correction.Le);
        Assert.Equal(Donnees.PhotoDuDefaut, reserve.PhotoDuDefaut);
        Assert.Equal(Donnees.Photo(1), tentative.Photo);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\n")]
    public void Demander_une_correction_sans_motif_est_refuse_sans_modifier_la_reserve(string motif)
    {
        var reserve = Donnees.ReserveEn(Situation.RepriseSoumise);
        var avant = InstantaneReserve.De(reserve);

        var refus = Assert.Throws<RegleMetierException>(() => reserve.DemanderCorrection(motif, Donnees.Jour(3)));

        Assert.Equal(CodeRegle.MotifObligatoire, refus.Code);
        InstantaneReserve.VerifierInchangee(avant, reserve);
    }

    [Theory]
    [InlineData(Situation.Ouverte)]
    [InlineData(Situation.Affectee)]
    [InlineData(Situation.RepriseSoumise)]
    [InlineData(Situation.Levee)]
    public void La_mention_a_corriger_n_apparait_que_apres_une_demande_de_correction(Situation situation)
    {
        Assert.False(Donnees.ReserveEn(situation).ACorriger);
        Assert.True(Donnees.ReserveEn(Situation.ACorriger).ACorriger);
    }
}
