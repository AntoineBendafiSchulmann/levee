import { useCallback, useEffect, useRef, useState } from 'react';

import { EnTete } from '../commun/EnTete';
import { FeuilleCriteres } from '../criteres/FeuilleCriteres';
import { FormulaireCriteres, type OptionsCriteres } from '../criteres/FormulaireCriteres';
import { libelleBoutonVoir, libelleCompteurs, type Resultats } from '../domaine/resultats';
import { formaterHeure, libelleJourCourt, libelleJourDu, libelleJourLong } from '../domaine/temps';
import type { JourIso, Salle, Spectacle } from '../domaine/types';
import type { Parcours } from '../parcours/useParcours';
import { ActionsAccueil } from './ActionsAccueil';
import { CarrouselAffiches } from './CarrouselAffiches';
import { construireDiapos } from './diapos';

interface Props {
  readonly parcours: Parcours;
  /** Jour courant : « ce soir » désigne ce jour-là. */
  readonly aujourdhui: JourIso;
  readonly spectacles: readonly Spectacle[];
  readonly salles: readonly Salle[];
  readonly options: OptionsCriteres;
  readonly resultats: Resultats;
}

/**
 * Accueil « Que voir ce soir ? ». « Voir les séances » ouvre les résultats ; « Préparer une autre
 * sortie » et les pastilles ouvrent la feuille de critères. L'activation d'une affiche affiche encore
 * un avis provisoire : la fiche séance arrive dans un lot suivant.
 */
export function PageAccueil({ parcours, aujourdhui, spectacles, salles, options, resultats }: Props) {
  const { criteres, lirePosition, memoriserPosition } = parcours;
  const [avis, setAvis] = useState<string | null>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const focaliser = parcours.naviguee;
  const diapos = construireDiapos(spectacles, salles, criteres.jour, aujourdhui);
  const quand = libelleJourDu(criteres.jour, aujourdhui);
  const origine = options.origines.find((o) => o.id === criteres.origine)?.libelle ?? criteres.origine;
  // Identité stable : le carrousel ne restitue sa position qu'au montage.
  const lirePositionAffiches = useCallback(() => lirePosition('affiches'), [lirePosition]);

  // Après une navigation (lien, retour du navigateur), le focus passe au titre de la page.
  useEffect(() => {
    if (focaliser) {
      titre.current?.focus({ preventScroll: true });
    }
  }, [focaliser]);

  return (
    <div className="flex h-dvh flex-col">
      <EnTete />

      <main className="flex flex-1 flex-col bureau:grid bureau:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] bureau:grid-rows-[1fr_auto_auto_1fr] bureau:gap-x-6">
        <div className="flex flex-col gap-1.5 px-4 pt-2.5 tablette:px-6 tablette:pt-7 tablette:pb-2 bureau:col-start-1 bureau:row-start-2 bureau:pt-0 bureau:pr-0 bureau:pb-5 bureau:pl-14">
          <p className="text-xs leading-[1.2] font-semibold tracking-[0.14em] text-texte-doux uppercase">
            {libelleJourLong(criteres.jour)} · à l’affiche
          </p>
          <h1
            ref={titre}
            tabIndex={-1}
            className="font-editorial text-[40px] leading-[0.98] font-normal tracking-[-0.01em] outline-none tablette:text-[60px] bureau:text-[84px]"
          >
            Que voir <span className="text-corail italic">ce soir</span> ?
          </h1>
        </div>

        <div className="flex flex-1 flex-col bureau:col-start-2 bureau:row-span-4 bureau:row-start-1">
          <CarrouselAffiches
            diapos={diapos}
            lirePosition={lirePositionAffiches}
            onPosition={(position) => {
              memoriserPosition('affiches', position);
            }}
            onActiver={(diapo) => {
              setAvis(`la fiche de « ${diapo.titre} » arrive dans un lot suivant.`);
            }}
          />
        </div>

        <div className="flex w-full max-w-[560px] flex-col px-4 pb-3 tablette:mx-auto tablette:px-6 tablette:pt-2 tablette:pb-7 bureau:col-start-1 bureau:row-start-3 bureau:mx-0 bureau:p-0 bureau:pl-14">
          <div role="status">
            {avis === null ? null : (
              <p className="mb-1.5 rounded-lg border border-dashed border-contour px-3 py-1 text-xs leading-4 text-texte-doux">
                <strong className="font-bold text-texte">Provisoire</strong> · {avis}
              </p>
            )}
          </div>
          <ActionsAccueil
            criteres={[
              { cle: 'Depuis', valeur: origine },
              { cle: '', valeur: libelleJourCourt(criteres.jour, aujourdhui) },
              { cle: 'Sortie au plus tard à', valeur: formaterHeure(criteres.limiteMinutes) },
            ]}
            libelleVoir={`Voir les séances de ${quand}`}
            detailVoir={libelleCompteurs(resultats.compteurs, resultats.impossiblesMasquees)}
            onVoir={parcours.voirSeances}
            onModifier={parcours.ouvrirFeuille}
          />
        </div>
      </main>

      <FeuilleCriteres
        ouverte={parcours.feuilleOuverte}
        onFermer={parcours.fermerFeuille}
        libelleVoir={libelleBoutonVoir(resultats.visibles.length)}
        onVoir={parcours.voirSeances}
      >
        <FormulaireCriteres criteres={criteres} options={options} onChange={parcours.modifierCriteres} />
      </FeuilleCriteres>
    </div>
  );
}
