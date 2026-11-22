import type { AfficheDef, FormeAffiche } from '../domaine/types';

interface Props {
  readonly affiche: AfficheDef;
  readonly titre: string;
  readonly auteur: string;
  readonly salle: string;
}

const pourcent = (n: number): string => `${String(n)}%`;

const CLASSES_TITRE = {
  editorial: 'font-editorial font-normal leading-[0.95] tracking-[-0.01em]',
  grotesque: 'font-sans font-extrabold uppercase leading-[0.9] tracking-[-0.02em]',
} as const;

function Forme({ forme }: { readonly forme: FormeAffiche }) {
  return (
    <span
      className="absolute block"
      style={{
        left: pourcent(forme.gauche),
        top: pourcent(forme.haut),
        width: pourcent(forme.largeur),
        aspectRatio: String(forme.ratio),
        borderRadius: forme.forme === 'rond' ? '50%' : '0',
        backgroundColor: forme.couleur,
        ...(forme.rotation === undefined ? {} : { transform: `rotate(${String(forme.rotation)}deg)` }),
        ...(forme.contour === undefined
          ? {}
          : { border: `${String(forme.contour.epaisseur)}cqw solid ${forme.contour.couleur}` }),
      }}
    />
  );
}

/**
 * Affiche de démonstration : deux formes et un titre, composés en CSS. Les tailles de texte
 * sont en `cqw` (largeur de l'affiche) pour que la composition suive la taille de l'affiche.
 * Décorative (`aria-hidden`) : le titre et la salle sont annoncés par la légende voisine.
 */
export function Affiche({ affiche, titre, auteur, salle }: Props) {
  const { famille, taille, italique, enHaut } = affiche.titre;
  return (
    <span
      aria-hidden="true"
      className="@container relative block aspect-[2/3] w-full overflow-hidden rounded-[2px]"
      style={{ backgroundColor: affiche.fond, color: affiche.encre }}
    >
      <Forme forme={affiche.formeA} />
      <Forme forme={affiche.formeB} />
      <span className="absolute inset-0 flex flex-col p-[7cqw]">
        <span className="block text-[3.8cqw] font-bold tracking-[0.16em] uppercase">{auteur}</span>
        <span
          className={`block ${CLASSES_TITRE[famille]}${italique ? ' italic' : ''}`}
          style={{ fontSize: `${String(taille)}cqw`, margin: enHaut ? '6cqw 0 auto' : 'auto 0 4cqw' }}
        >
          {titre}
        </span>
        <span className="block text-[3.4cqw] font-medium tracking-[0.04em]">{salle}</span>
      </span>
    </span>
  );
}
