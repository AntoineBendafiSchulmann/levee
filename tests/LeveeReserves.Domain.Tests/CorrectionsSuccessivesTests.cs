using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

public class CorrectionsSuccessivesTests
{
    [Fact]
    public void Deux_corrections_successives_puis_une_validation_conservent_chaque_photo_et_chaque_motif()
    {
        var reserve = Donnees.ReserveEn(Situation.Affectee);

        reserve.SoumettreReprise(Donnees.Artisan, Donnees.Photo(1), Donnees.Jour(2));
        reserve.DemanderCorrection("Joint irrégulier", Donnees.Jour(3));
        reserve.SoumettreReprise(Donnees.Artisan, Donnees.Photo(2), Donnees.Jour(4));
        reserve.DemanderCorrection("Teinte différente", Donnees.Jour(5));
        reserve.SoumettreReprise(Donnees.Artisan, Donnees.Photo(3), Donnees.Jour(6));
        reserve.ValiderReprise(Donnees.Jour(7));

        Assert.Equal(StatutReserve.Levee, reserve.Statut);
        Assert.False(reserve.ACorriger);
        Assert.Equal(Donnees.PhotoDuDefaut, reserve.PhotoDuDefaut);

        Assert.Equal([1, 2, 3], reserve.Tentatives.Select(t => t.Numero));
        Assert.Equal(
            [Donnees.Photo(1), Donnees.Photo(2), Donnees.Photo(3)],
            reserve.Tentatives.Select(t => t.Photo));
        Assert.Equal(
            [Donnees.Jour(2), Donnees.Jour(4), Donnees.Jour(6)],
            reserve.Tentatives.Select(t => t.SoumiseLe));

        var refus1 = Assert.IsType<CorrectionDemandee>(reserve.Tentatives[0].Decision);
        Assert.Equal("Joint irrégulier", refus1.Motif);
        Assert.Equal(Donnees.Jour(3), refus1.Le);

        var refus2 = Assert.IsType<CorrectionDemandee>(reserve.Tentatives[1].Decision);
        Assert.Equal("Teinte différente", refus2.Motif);
        Assert.Equal(Donnees.Jour(5), refus2.Le);

        var validation = Assert.IsType<RepriseValidee>(reserve.Tentatives[2].Decision);
        Assert.Equal(Donnees.Jour(7), validation.Le);
    }

    [Fact]
    public void La_mention_a_corriger_disparait_a_la_nouvelle_soumission_et_le_refus_reste_consultable()
    {
        var reserve = Donnees.ReserveEn(Situation.ACorriger);
        Assert.Equal(StatutReserve.Affectee, reserve.Statut);
        Assert.True(reserve.ACorriger);

        reserve.SoumettreReprise(Donnees.Artisan, Donnees.Photo(2), Donnees.Jour(4));

        Assert.Equal(StatutReserve.RepriseSoumise, reserve.Statut);
        Assert.False(reserve.ACorriger);
        Assert.Equal(2, reserve.Tentatives.Count);

        var refus = Assert.IsType<CorrectionDemandee>(reserve.Tentatives[0].Decision);
        Assert.Equal(Donnees.MotifInitial, refus.Motif);
        Assert.Equal(Donnees.Jour(3), refus.Le);
        Assert.Equal(Donnees.Photo(1), reserve.Tentatives[0].Photo);

        Assert.Equal(Donnees.Photo(2), reserve.Tentatives[1].Photo);
        Assert.Null(reserve.Tentatives[1].Decision);
    }

    [Fact]
    public void Une_decision_ne_modifie_que_la_derniere_tentative()
    {
        var reserve = Donnees.ReserveEn(Situation.ACorriger);
        reserve.SoumettreReprise(Donnees.Artisan, Donnees.Photo(2), Donnees.Jour(4));
        var premiereAvant = InstantaneTentative.De(reserve.Tentatives[0]);

        reserve.DemanderCorrection("Teinte différente", Donnees.Jour(5));

        Assert.Equal(premiereAvant, InstantaneTentative.De(reserve.Tentatives[0]));
    }

    [Fact]
    public void L_historique_des_tentatives_ne_peut_pas_etre_modifie_depuis_l_exterieur()
    {
        var reserve = Donnees.ReserveEn(Situation.ACorriger);
        var avant = InstantaneReserve.De(reserve);

        Assert.IsNotType<List<TentativeReprise>>(reserve.Tentatives);
        var commeListe = Assert.IsAssignableFrom<IList<TentativeReprise>>(reserve.Tentatives);
        Assert.True(commeListe.IsReadOnly);
        Assert.Throws<NotSupportedException>(commeListe.Clear);
        Assert.Throws<NotSupportedException>(() => commeListe.RemoveAt(0));
        Assert.Throws<NotSupportedException>(() => commeListe[0] = reserve.Tentatives[0]);

        InstantaneReserve.VerifierInchangee(avant, reserve);
    }
}
