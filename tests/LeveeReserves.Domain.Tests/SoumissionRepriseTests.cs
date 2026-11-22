using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

public class SoumissionRepriseTests
{
    [Fact]
    public void L_artisan_affecte_soumet_sa_premiere_reprise()
    {
        var reserve = Donnees.ReserveEn(Situation.Affectee);

        reserve.SoumettreReprise(Donnees.Artisan, Donnees.Photo(1), Donnees.Jour(2));

        Assert.Equal(StatutReserve.RepriseSoumise, reserve.Statut);
        var tentative = Assert.Single(reserve.Tentatives);
        Assert.Equal(1, tentative.Numero);
        Assert.Equal(Donnees.Photo(1), tentative.Photo);
        Assert.Equal(Donnees.Jour(2), tentative.SoumiseLe);
        Assert.Null(tentative.Decision);
        Assert.Equal(Donnees.PhotoDuDefaut, reserve.PhotoDuDefaut);
    }

    [Theory]
    [InlineData(Situation.Affectee)]
    [InlineData(Situation.ACorriger)]
    public void Un_autre_artisan_ne_peut_pas_soumettre_et_la_reserve_reste_inchangee(Situation situation)
    {
        var reserve = Donnees.ReserveEn(situation);
        var avant = InstantaneReserve.De(reserve);

        var refus = Assert.Throws<RegleMetierException>(
            () => reserve.SoumettreReprise(Donnees.AutreArtisan, Donnees.Photo(9), Donnees.Jour(9)));

        Assert.Equal(CodeRegle.ArtisanNonAffecte, refus.Code);
        InstantaneReserve.VerifierInchangee(avant, reserve);
    }

    [Theory]
    [InlineData(Situation.Affectee)]
    [InlineData(Situation.ACorriger)]
    public void Soumettre_sans_artisan_renseigne_est_refuse_sans_modifier_la_reserve(Situation situation)
    {
        var reserve = Donnees.ReserveEn(situation);
        var avant = InstantaneReserve.De(reserve);

        var refus = Assert.Throws<RegleMetierException>(
            () => reserve.SoumettreReprise(default, Donnees.Photo(9), Donnees.Jour(9)));

        Assert.Equal(CodeRegle.ArtisanNonAffecte, refus.Code);
        InstantaneReserve.VerifierInchangee(avant, reserve);
    }

    [Theory]
    [InlineData(Situation.Affectee)]
    [InlineData(Situation.ACorriger)]
    public void Soumettre_sans_photo_est_refuse_sans_modifier_la_reserve(Situation situation)
    {
        var reserve = Donnees.ReserveEn(situation);
        var avant = InstantaneReserve.De(reserve);

        var refus = Assert.Throws<RegleMetierException>(
            () => reserve.SoumettreReprise(Donnees.Artisan, default, Donnees.Jour(9)));

        Assert.Equal(CodeRegle.PhotoObligatoire, refus.Code);
        InstantaneReserve.VerifierInchangee(avant, reserve);
    }
}
