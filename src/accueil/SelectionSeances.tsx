import type { Ref } from 'react';

import { surClicSimple } from '../composants/lien';
import { libelleCompteurs, type Resultats, type ResultatSeance } from '../domaine/resultats';
import { formaterHeure } from '../domaine/temps';
import type { CriteresSortie } from '../domaine/types';
import { ID_SELECTION } from '../parcours/chemins';
import { CarteSeance } from '../composants/CarteSeance';

interface Props {
  readonly selection: readonly ResultatSeance[];
  readonly resultats: Resultats;
  readonly criteres: CriteresSortie;
  readonly origineLibelle: string;
  /** Ouvre la fiche de la séance exacte ; l'identifiant désigne aussi la carte qui retrouvera le focus. */
  readonly onOuvrir: (identifiant: string) => void;
  /** « Voir tous les résultats » : la liste complète (`/seances`), avec les critères courants. */
  readonly onTous: () => void;
  readonly onModifier: () => void;
  readonly refSection: Ref<HTMLElement>;
  readonly refTitre: Ref<HTMLHeadingElement>;
}

const BOUTON =
  'inline-flex min-h-11 items-center rounded-full border border-contour px-[18px] text-[15px] font-semibold hover:bg-surface-survol';

/**
 * Sous l'accueil : au plus trois séances qui rentrent dans la soirée, tirées des résultats déjà calculés.
 * La liste complète, avec filtres et compteurs, reste sur `/seances`.
 */
export function SelectionSeances({ selection, resultats, criteres, origineLibelle, onOuvrir, onTous, onModifier, refSection, refTitre }: Props) {
  return (
    <section
      ref={refSection}
      id={ID_SELECTION}
      aria-labelledby="titre-seances-du-soir"
      className="border-t border-filet px-4 pt-10 pb-14 tablette:px-8 bureau:px-0 ultra:pt-16 ultra:pb-24"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-5 ultra:max-w-[1560px] ultra:gap-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex flex-col gap-2">
            <h2
              ref={refTitre}
              id="titre-seances-du-soir"
              tabIndex={-1}
              className="font-editorial text-[32px] leading-none font-normal outline-none tablette:text-[40px] bureau:text-[44px] ultra:text-[60px]"
            >
              Les séances qui rentrent <span className="text-corail italic">dans votre soirée</span>
            </h2>
            <p className="text-sm text-texte-doux">
              {libelleCompteurs(resultats.compteurs, resultats.impossiblesMasquees)} · depuis {origineLibelle} à{' '}
              {formaterHeure(criteres.departMinutes)}, sorti avant {formaterHeure(criteres.limiteMinutes)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onModifier} className={BOUTON}>
              Modifier mes critères
            </button>
            <a
              href="/seances"
              onClick={surClicSimple(onTous)}
              className={`${BOUTON} border-corail text-corail`}
            >
              Voir tous les résultats →
            </a>
          </div>
        </div>

        {selection.length === 0 ? (
          <p className="rounded-md border border-dashed border-contour px-5 py-7 text-center font-editorial text-[26px] italic">
            Aucune séance ne rentre dans cette soirée.
          </p>
        ) : (
          <ul className="grid grid-cols-1 items-start gap-3 tablette:grid-cols-2 bureau:grid-cols-3 ultra:gap-5">
            {selection.map((resultat) => (
              <li key={resultat.id}>
                <CarteSeance resultat={resultat} criteres={criteres} origineLibelle={origineLibelle} onOuvrir={onOuvrir} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
