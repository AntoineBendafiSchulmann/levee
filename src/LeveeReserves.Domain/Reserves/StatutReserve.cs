namespace LeveeReserves.Domain.Reserves;

public enum StatutReserve
{
    /// <summary>Créée par le conducteur, pas encore affectée à un artisan.</summary>
    Ouverte = 1,

    /// <summary>En attente d'une reprise de l'artisan affecté : la première, ou une correction.</summary>
    Affectee = 2,

    /// <summary>Une reprise attend la décision du conducteur.</summary>
    RepriseSoumise = 3,

    /// <summary>Reprise validée. Statut final.</summary>
    Levee = 4,
}
