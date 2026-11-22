using LeveeReserves.Domain.Reserves;

namespace LeveeReserves.Domain.Tests;

public class TransitionsInterditesTests
{
    // Toutes les paires (situation, opération) hors du tableau des transitions validé.
    // Les arguments sont valides : seul le statut motive le refus.
    [Theory]
    [InlineData(Situation.Ouverte, Operation.SoumettreReprise)]
    [InlineData(Situation.Ouverte, Operation.ValiderReprise)]
    [InlineData(Situation.Ouverte, Operation.DemanderCorrection)]
    [InlineData(Situation.Affectee, Operation.Affecter)]
    [InlineData(Situation.Affectee, Operation.ValiderReprise)]
    [InlineData(Situation.Affectee, Operation.DemanderCorrection)]
    [InlineData(Situation.RepriseSoumise, Operation.Affecter)]
    [InlineData(Situation.RepriseSoumise, Operation.SoumettreReprise)]
    [InlineData(Situation.ACorriger, Operation.Affecter)]
    [InlineData(Situation.ACorriger, Operation.ValiderReprise)]
    [InlineData(Situation.ACorriger, Operation.DemanderCorrection)]
    [InlineData(Situation.Levee, Operation.Affecter)]
    [InlineData(Situation.Levee, Operation.SoumettreReprise)]
    [InlineData(Situation.Levee, Operation.ValiderReprise)]
    [InlineData(Situation.Levee, Operation.DemanderCorrection)]
    public void Une_operation_hors_du_tableau_des_transitions_est_refusee_sans_modifier_la_reserve(
        Situation situation,
        Operation operation)
    {
        var reserve = Donnees.ReserveEn(situation);
        var avant = InstantaneReserve.De(reserve);

        var refus = Assert.Throws<RegleMetierException>(() => Donnees.Executer(reserve, operation));

        Assert.Equal(CodeRegle.TransitionInterdite, refus.Code);
        InstantaneReserve.VerifierInchangee(avant, reserve);
    }

    // Contrôle du tableau lui-même : les cinq transitions permises aboutissent au statut prévu.
    [Theory]
    [InlineData(Situation.Ouverte, Operation.Affecter, StatutReserve.Affectee)]
    [InlineData(Situation.Affectee, Operation.SoumettreReprise, StatutReserve.RepriseSoumise)]
    [InlineData(Situation.ACorriger, Operation.SoumettreReprise, StatutReserve.RepriseSoumise)]
    [InlineData(Situation.RepriseSoumise, Operation.ValiderReprise, StatutReserve.Levee)]
    [InlineData(Situation.RepriseSoumise, Operation.DemanderCorrection, StatutReserve.Affectee)]
    public void Une_operation_du_tableau_des_transitions_aboutit_au_statut_prevu(
        Situation situation,
        Operation operation,
        StatutReserve attendu)
    {
        var reserve = Donnees.ReserveEn(situation);

        Donnees.Executer(reserve, operation);

        Assert.Equal(attendu, reserve.Statut);
    }
}
