import type { GroupeSeance } from '../domaine/evaluation';

interface Props {
  readonly departMinutes: number;
  readonly arriveeMinutes: number | null;
  readonly debutMinutes: number;
  readonly fin: { readonly min: number; readonly max: number } | null;
  readonly limiteMinutes: number;
  readonly groupe: GroupeSeance;
}

/** Motifs repris par la légende des résultats. */
export const MOTIF_INCERTAIN =
  'repeating-linear-gradient(45deg, var(--color-attention) 0 3px, transparent 3px 6px)';
export const MOTIF_TRAJET = 'repeating-linear-gradient(90deg, var(--color-texte) 0 4px, transparent 4px 7px)';

const pourcent = (valeur: number): string => `${String(valeur)}%`;

/**
 * Frise de la soirée : trajet estimé (tirets), représentation (barre pleine ; dégradé si la durée
 * est inconnue), plage de fin incertaine (hachures) et heure limite (trait corail). Décorative :
 * les mêmes informations sont écrites dans la carte.
 */
export function FriseHoraire({ departMinutes, arriveeMinutes, debutMinutes, fin, limiteMinutes, groupe }: Props) {
  const debut = Math.floor(departMinutes / 60) * 60;
  const terme = Math.max(23 * 60 + 30, limiteMinutes + 30);
  const position = (minutes: number) => Math.max(0, Math.min(100, ((minutes - debut) / (terme - debut)) * 100));
  const rangee = 'absolute motion-safe:transition-[left,width] motion-safe:duration-[350ms]';

  return (
    <div aria-hidden="true" className="relative h-4 w-full">
      <div className="absolute inset-x-0 top-[7px] h-0.5 bg-filet" />
      {arriveeMinutes === null ? null : (
        <div
          className={`${rangee} top-[7px] h-0.5`}
          style={{
            left: pourcent(position(departMinutes)),
            width: pourcent(position(arriveeMinutes) - position(departMinutes)),
            backgroundImage: MOTIF_TRAJET,
          }}
        />
      )}
      <div
        className={`${rangee} top-1 h-2`}
        style={{
          left: pourcent(position(debutMinutes)),
          width: pourcent((fin === null ? 100 : position(fin.min)) - position(debutMinutes)),
          background:
            fin === null
              ? 'linear-gradient(90deg, var(--color-attention), transparent)'
              : groupe === 'impossible'
                ? 'oklch(0.55 0.015 285)'
                : 'var(--color-texte)',
        }}
      />
      {fin !== null && fin.max > fin.min ? (
        <div
          className={`${rangee} top-1 h-2 outline outline-attention`}
          style={{
            left: pourcent(position(fin.min)),
            width: pourcent(position(fin.max) - position(fin.min)),
            background: MOTIF_INCERTAIN,
          }}
        />
      ) : null}
      <div
        className="absolute inset-y-0 w-0.5 bg-corail motion-safe:transition-[left] motion-safe:duration-[350ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ left: pourcent(position(limiteMinutes)) }}
      />
    </div>
  );
}
