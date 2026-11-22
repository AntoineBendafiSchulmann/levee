namespace LeveeReserves.Domain.Reserves;

/// <summary>
/// Une réserve et son cycle de vie. Chaque opération vérifie toutes ses règles avant de modifier
/// quoi que ce soit : un refus (<see cref="RegleMetierException"/>) laisse la réserve intacte.
/// Les dates sont fournies par l'appelant.
/// </summary>
public sealed class Reserve
{
    private readonly List<TentativeReprise> _tentatives = [];

    private Reserve(ReserveId id, EmplacementSurPlan emplacement, PhotoId photoDuDefaut, DateTimeOffset creeeLe)
    {
        Id = id;
        Emplacement = emplacement;
        PhotoDuDefaut = photoDuDefaut;
        CreeeLe = creeeLe;
        Statut = StatutReserve.Ouverte;
        Tentatives = _tentatives.AsReadOnly();
    }

    public ReserveId Id { get; }

    public EmplacementSurPlan Emplacement { get; }

    public PhotoId PhotoDuDefaut { get; }

    public DateTimeOffset CreeeLe { get; }

    public StatutReserve Statut { get; private set; }

    /// <summary>Absent tant que la réserve est ouverte.</summary>
    public ArtisanId? ArtisanAffecte { get; private set; }

    /// <summary>Tentatives de reprise, de la plus ancienne à la plus récente. Lecture seule.</summary>
    public IReadOnlyList<TentativeReprise> Tentatives { get; }

    /// <summary>
    /// Vrai quand la réserve attend une nouvelle reprise après une demande de correction.
    /// Dérivé de la dernière tentative, jamais stocké.
    /// </summary>
    public bool ACorriger =>
        Statut == StatutReserve.Affectee && _tentatives is [.., { Decision: CorrectionDemandee }];

    public static Reserve Creer(
        ReserveId id,
        EmplacementSurPlan emplacement,
        PhotoId photoDuDefaut,
        DateTimeOffset creeeLe)
    {
        ArgumentNullException.ThrowIfNull(emplacement);
        ExigerPhoto(photoDuDefaut, "Une réserve se crée avec une photo du défaut.");

        return new Reserve(id, emplacement, photoDuDefaut, creeeLe);
    }

    public void Affecter(ArtisanId artisan)
    {
        ExigerStatut(StatutReserve.Ouverte, "affecter la réserve");
        if (artisan == default)
        {
            throw new RegleMetierException(
                CodeRegle.ArtisanObligatoire,
                "L'affectation doit désigner un artisan.");
        }

        ArtisanAffecte = artisan;
        Statut = StatutReserve.Affectee;
    }

    public void SoumettreReprise(ArtisanId artisan, PhotoId photo, DateTimeOffset soumiseLe)
    {
        ExigerStatut(StatutReserve.Affectee, "soumettre une reprise");
        if (artisan != ArtisanAffecte)
        {
            throw new RegleMetierException(
                CodeRegle.ArtisanNonAffecte,
                "Seul l'artisan affecté peut soumettre une reprise.");
        }

        ExigerPhoto(photo, "Une reprise se soumet avec une photo.");

        _tentatives.Add(new TentativeReprise(_tentatives.Count + 1, photo, soumiseLe, decision: null));
        Statut = StatutReserve.RepriseSoumise;
    }

    public void ValiderReprise(DateTimeOffset decideeLe)
    {
        ExigerStatut(StatutReserve.RepriseSoumise, "valider la reprise");

        DeciderDerniereTentative(new RepriseValidee(decideeLe));
        Statut = StatutReserve.Levee;
    }

    public void DemanderCorrection(string motif, DateTimeOffset decideeLe)
    {
        ExigerStatut(StatutReserve.RepriseSoumise, "demander une correction");
        if (string.IsNullOrWhiteSpace(motif))
        {
            throw new RegleMetierException(
                CodeRegle.MotifObligatoire,
                "Une demande de correction exige un motif.");
        }

        DeciderDerniereTentative(new CorrectionDemandee(decideeLe, motif));
        Statut = StatutReserve.Affectee;
    }

    private static void ExigerPhoto(PhotoId photo, string message)
    {
        if (photo == default)
        {
            throw new RegleMetierException(CodeRegle.PhotoObligatoire, message);
        }
    }

    private void ExigerStatut(StatutReserve attendu, string operation)
    {
        if (Statut != attendu)
        {
            throw new RegleMetierException(
                CodeRegle.TransitionInterdite,
                $"Impossible de {operation} : la réserve est au statut {Statut}, {attendu} est requis.");
        }
    }

    // Au statut RepriseSoumise, la dernière tentative existe et n'a pas encore de décision.
    private void DeciderDerniereTentative(DecisionReprise decision) =>
        _tentatives[^1] = _tentatives[^1].Avec(decision);
}
