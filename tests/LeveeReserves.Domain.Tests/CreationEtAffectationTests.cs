using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

public class CreationEtAffectationTests
{
    [Fact]
    public void Une_reserve_creee_est_ouverte_avec_sa_photo_son_emplacement_et_sa_date()
    {
        var reserve = Donnees.ReserveOuverte();

        Assert.Equal(StatutReserve.Ouverte, reserve.Statut);
        Assert.Equal(Donnees.PhotoDuDefaut, reserve.PhotoDuDefaut);
        Assert.Equal(Donnees.Emplacement, reserve.Emplacement);
        Assert.Equal(Donnees.Jour(1), reserve.CreeeLe);
        Assert.Null(reserve.ArtisanAffecte);
        Assert.Empty(reserve.Tentatives);
        Assert.False(reserve.ACorriger);
    }

    [Fact]
    public void Creer_une_reserve_sans_photo_est_refuse()
    {
        var refus = Assert.Throws<RegleMetierException>(() => Reserve.Creer(
            new ReserveId(Guid.NewGuid()),
            Donnees.Emplacement,
            photoDuDefaut: default,
            Donnees.Jour(1)));

        Assert.Equal(CodeRegle.PhotoObligatoire, refus.Code);
    }

    [Fact]
    public void Affecter_une_reserve_ouverte_la_passe_a_affectee()
    {
        var reserve = Donnees.ReserveOuverte();

        reserve.Affecter(Donnees.Artisan);

        Assert.Equal(StatutReserve.Affectee, reserve.Statut);
        Assert.Equal(Donnees.Artisan, reserve.ArtisanAffecte);
        Assert.Empty(reserve.Tentatives);
        Assert.False(reserve.ACorriger);
    }

    [Fact]
    public void Affecter_sans_artisan_renseigne_est_refuse_sans_modifier_la_reserve()
    {
        var reserve = Donnees.ReserveOuverte();
        var avant = InstantaneReserve.De(reserve);

        var refus = Assert.Throws<RegleMetierException>(() => reserve.Affecter(default));

        Assert.Equal(CodeRegle.ArtisanObligatoire, refus.Code);
        InstantaneReserve.VerifierInchangee(avant, reserve);
    }
}
