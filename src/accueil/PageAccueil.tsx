import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { EnTete } from '../composants/EnTete';
import { FeuilleCriteres } from '../criteres/FeuilleCriteres';
import { FormulaireCriteres, type OptionsCriteres } from '../criteres/FormulaireCriteres';
import { libelleBoutonVoir, libelleCompteurs, type Resultats } from '../domaine/resultats';
import { formaterHeure, libelleJourCourt, libelleJourDu, libelleJourLong } from '../domaine/temps';
import type { JourIso, Salle, Spectacle } from '../domaine/types';
import { focaliserCle, ramenerEnVue } from '../parcours/focus';
import type { Parcours } from '../parcours/useParcours';
import { ActionsAccueil } from './ActionsAccueil';
import { CarrouselAffiches } from './CarrouselAffiches';
import { construireDiapos } from './diapos';
import { selectionSoiree } from './selection';
import { SelectionSeances } from './SelectionSeances';
import { useMouvementReduit } from './useMediaQuery';

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
 * Accueil « Que voir ce soir ? » : la pièce à l'affiche avec ses séances, puis, en dessous, les séances qui
 * rentrent dans la soirée. « Voir les séances » et « Voir tous les résultats » ouvrent la liste complète ;
 * « Préparer une autre sortie » et les pastilles ouvrent la feuille de critères ; activer l'affiche ou une
 * séance ouvre la fiche. La page défile dans son conteneur : sa position est mémorisée pour le retour.
 */
export function PageAccueil({ parcours, aujourdhui, spectacles, salles, options, resultats }: Props) {
  const { criteres, cleRetour, lirePosition, memoriserPosition, lireAfficheActive, memoriserAfficheActive, consommerAncre } = parcours;
  const reduire = useMouvementReduit();
  const defileur = useRef<HTMLElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const section = useRef<HTMLElement>(null);
  const titreSelection = useRef<HTMLHeadingElement>(null);
  /** « selection » quand on arrive par « Séances de la soirée » depuis une autre page. */
  const ancre = useRef<'selection' | null>(null);
  const focaliser = parcours.naviguee;
  const diapos = construireDiapos(spectacles, salles, criteres, aujourdhui);
  const selection = selectionSoiree(resultats);
  const quand = libelleJourDu(criteres.jour, aujourdhui);
  const origine = options.origines.find((o) => o.id === criteres.origine)?.libelle ?? criteres.origine;
  const onAffiche = useCallback(
    (id: string) => {
      memoriserAfficheActive(id);
    },
    [memoriserAfficheActive],
  );

  // Position de lecture : en haut, sous « Séances de la soirée » depuis une autre page, ou celle du retour.
  useLayoutEffect(() => {
    const page = defileur.current;
    if (page === null) {
      return;
    }
    ancre.current = consommerAncre() ?? ancre.current;
    page.scrollTop = ancre.current === 'selection' ? (section.current?.offsetTop ?? 0) : lirePosition('accueil');
  }, [consommerAncre, lirePosition]);

  // Après une navigation, le focus passe au titre de la page ; au retour d'une fiche, il revient sur l'élément
  // d'où l'on est parti (affiche active, séance sous l'affiche ou carte de la sélection), ramené en vue.
  useEffect(() => {
    if (!focaliser) {
      return;
    }
    if (ancre.current === 'selection') {
      titreSelection.current?.focus({ preventScroll: true });
      return;
    }
    const element = cleRetour === null ? null : focaliserCle(cleRetour);
    if (element === null) {
      titre.current?.focus({ preventScroll: true });
    } else if (defileur.current !== null) {
      ramenerEnVue(element, defileur.current, 0);
    }
  }, [focaliser, cleRetour]);

  const comportement = reduire ? 'auto' : 'smooth';
  const remonter = () => {
    defileur.current?.scrollTo({ top: 0, behavior: comportement });
    titre.current?.focus({ preventScroll: true });
  };
  const versSelection = () => {
    defileur.current?.scrollTo({ top: section.current?.offsetTop ?? 0, behavior: comportement });
    titreSelection.current?.focus({ preventScroll: true });
  };

  return (
    <div className="flex h-dvh flex-col">
      <EnTete ecran="accueil" date={libelleJourLong(criteres.jour)} onAccueil={remonter} onSeances={versSelection} />

      <main
        ref={defileur}
        onScroll={(evenement) => {
          memoriserPosition('accueil', evenement.currentTarget.scrollTop);
        }}
        className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <CarrouselAffiches
          diapos={diapos}
          lireIdInitial={() => (cleRetour !== null && diapos.some((d) => d.id === cleRetour) ? cleRetour : lireAfficheActive())}
          onAffiche={onAffiche}
          onOuvrirPiece={(diapo) => {
            parcours.ouvrirFiche({ type: 'piece', id: diapo.id }, 'accueil', diapo.id);
          }}
          onOuvrirSeance={(identifiant, cle) => {
            parcours.ouvrirFiche({ type: 'seance', id: identifiant }, 'accueil', cle);
          }}
          rappelCriteres={`Depuis ${origine} à ${formaterHeure(criteres.departMinutes)}`}
          introduction={
            <div className="flex flex-col gap-1.5">
              <p className="text-xs leading-[1.2] font-semibold tracking-[0.14em] text-texte-doux uppercase">
                {libelleJourLong(criteres.jour)} · à l’affiche
              </p>
              <h1
                ref={titre}
                tabIndex={-1}
                className="font-editorial text-[30px] leading-none font-normal tracking-[-0.01em] outline-none tablette:text-[44px] ultra:text-[64px]"
              >
                Que voir <span className="text-corail italic">ce soir</span> ?
              </h1>
            </div>
          }
          actions={
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
          }
        />

        <SelectionSeances
          selection={selection}
          resultats={resultats}
          criteres={criteres}
          origineLibelle={origine}
          onOuvrir={(identifiant) => {
            parcours.ouvrirFiche({ type: 'seance', id: identifiant }, 'accueil', identifiant);
          }}
          onTous={parcours.voirSeances}
          onModifier={parcours.ouvrirFeuille}
          refSection={section}
          refTitre={titreSelection}
        />
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
