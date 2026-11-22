namespace LeveeReserves.Domain.Reserves;

// Un identifiant laissé à sa valeur par défaut (Guid vide) est considéré comme non renseigné.

public readonly record struct ReserveId(Guid Valeur);

public readonly record struct PlanId(Guid Valeur);

public readonly record struct PhotoId(Guid Valeur);

public readonly record struct ArtisanId(Guid Valeur);
