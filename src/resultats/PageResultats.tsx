import { useEffect, useLayoutEffect, useRef } from 'react';

import { Navbar } from '../composants/Navbar';
import { FeuilleCriteres } from '../criteres/FeuilleCriteres';
import { FormulaireCriteres, type OptionsCriteres } from '../criteres/FormulaireCriteres';
import { ReglageHeure } from '../criteres/ReglageHeure';
import { LIMITE_MAX_MINUTES, LIMITE_MIN_MINUTES, PAS_HEURE_MINUTES } from '../domaine/bornesHoraires';
import { libelleGenre } from '../domaine/genres';
import { libelleBoutonVoir, libelleCompteurs, type Resultats } from '../domaine/resultats';
import { formaterHeure, libelleJourCourt, libelleJourLong } from '../domaine/temps';
import { pluriel } from '../domaine/texte';
import { focaliserCle, ramenerEnVue } from '../parcours/focus';
import type { Parcours } from '../parcours/useParcours';
import { CarteSeance } from '../composants/CarteSeance';
import { MOTIF_INCERTAIN, MOTIF_TRAJET } from '../composants/FriseHoraire';

interface Props {
  readonly parcours: Parcours;
  readonly aujourdhui: string;
  readonly options: OptionsCriteres;
  readonly resultats: Resultats;
}

const PASTILLE = 'min-h-11 flex-none rounded-full border border-filet bg-surface px-3.5 text-sm font-semibold whitespace-nowrap';

/**
 * Séances qui rentrent dans la soirée, une carte par séance. Les critères se règlent en direct :
 * barre collante et feuille sur mobile et tablette, colonne fixe à gauche sur grand écran.
 */
export function PageResultats({ parcours, aujourdhui, options, resultats }: Props) {
  const { criteres, lirePosition, memoriserPosition } = parcours;
  const defileur = useRef<HTMLElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const bandeau = useRef<HTMLDivElement>(null);
  const focaliser = parcours.naviguee;
  const { cleRetour } = parcours;

  // Au retour, la liste retrouve sa position de défilement.
  useLayoutEffect(() => {
    if (defileur.current !== null) {
      defileur.current.scrollTop = lirePosition('resultats');
    }
  }, [lirePosition]);

  // Après une navigation (lien, bouton, retour du navigateur), le focus passe au titre de la page ; au retour
  // d'une fiche, il revient sur la carte d'où l'on est parti. La position restituée n'est corrigée que si ce lien
  // est hors de la zone de lecture (par exemple après une actualisation, qui remet le défilement à zéro) ou
  // sous le bandeau collant : un lien déjà visible ne bouge pas.
  useEffect(() => {
    if (!focaliser) {
      return;
    }
    const carte = cleRetour === null ? null : focaliserCle(cleRetour);
    if (carte === null) {
      titre.current?.focus({ preventScroll: true });
    } else if (defileur.current !== null) {
      const bande = bandeau.current;
      ramenerEnVue(carte, defileur.current, bande !== null && bande.offsetHeight > 0 ? bande.getBoundingClientRect().bottom : 0);
    }
  }, [focaliser, cleRetour]);

  const origine = options.origines.find((o) => o.id === criteres.origine)?.libelle ?? criteres.origine;
  const formulaire = (
    <FormulaireCriteres criteres={criteres} options={options} onChange={parcours.modifierCriteres} />
  );
  const filtresActifs = criteres.genres.length > 0 || criteres.auteur !== '' || criteres.masquerImpossibles;
  const pastilles = [
    libelleJourCourt(criteres.jour, aujourdhui),
    `Depuis ${origine}`,
    `Départ ${formaterHeure(criteres.departMinutes)}`,
    criteres.genres.length === 0 ? 'Tous genres' : criteres.genres.map(libelleGenre).join(', '),
    ...(criteres.auteur === '' ? [] : [criteres.auteur]),
  ];
  const nombreAvant = resultats.avantDepart.length;

  return (
    <div className="flex h-dvh flex-col">
      <Navbar ecran="resultats" date={libelleJourLong(criteres.jour)} onAccueil={parcours.retournerAccueil} onSeances={parcours.allerSeancesDuSoir} />

      <div className="flex min-h-0 flex-1 bureau:grid bureau:grid-cols-[372px_minmax(0,1fr)]">
        <aside
          aria-label="Critères de la sortie"
          className="hidden overflow-y-auto border-r border-filet bg-surface bureau:block"
        >
          <h2 className="px-5 pt-[18px] pb-2.5 font-editorial text-[30px] leading-none font-normal italic">Votre sortie</h2>
          <div className="px-5 pt-2.5 pb-6">{formulaire}</div>
        </aside>

        <main
          ref={defileur}
          onScroll={(evenement) => {
            memoriserPosition('resultats', evenement.currentTarget.scrollTop);
          }}
          className="min-h-0 min-w-0 flex-1 overflow-auto"
        >
          <div ref={bandeau} className="sticky top-0 z-10 flex flex-col gap-2 border-b border-filet bg-fond px-4 py-2.5 tablette:px-6 bureau:hidden">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
              <button
                type="button"
                onClick={parcours.ouvrirFeuille}
                className="min-h-11 flex-none rounded-full border border-texte bg-texte px-3.5 text-sm font-bold text-fond"
              >
                Filtres
              </button>
              {pastilles.map((pastille) => (
                <button key={pastille} type="button" onClick={parcours.ouvrirFeuille} className={PASTILLE}>
                  {pastille}
                </button>
              ))}
            </div>
            <ReglageHeure
              variante="barre"
              accent
              libelle="Sortie au plus tard à"
              minutes={criteres.limiteMinutes}
              min={LIMITE_MIN_MINUTES}
              max={LIMITE_MAX_MINUTES}
              pas={PAS_HEURE_MINUTES}
              libelleMoins="Sortie 5 minutes plus tôt"
              libellePlus="Sortie 5 minutes plus tard"
              onChange={(limiteMinutes) => {
                parcours.modifierCriteres({ limiteMinutes });
              }}
            />
          </div>

          <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-4 pt-[18px] pb-8 tablette:px-6 tablette:pt-[22px] tablette:pb-10 bureau:px-8 bureau:pt-7 bureau:pb-12">
            <div className="flex flex-col gap-1.5">
              <h1
                ref={titre}
                tabIndex={-1}
                className="font-editorial text-[34px] leading-none font-normal outline-none tablette:text-[44px] bureau:text-5xl"
              >
                {libelleJourLong(criteres.jour)}
              </h1>
              <p aria-live="polite" className="text-sm text-texte-doux">
                {libelleCompteurs(resultats.compteurs, resultats.impossiblesMasquees)} · depuis {origine} à{' '}
                {formaterHeure(criteres.departMinutes)}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-texte-doux">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-0.5 w-[22px]" style={{ backgroundImage: MOTIF_TRAJET }} />
                  Trajet estimé
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-2 w-[22px] bg-texte" />
                  Représentation
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="h-2 w-[22px] outline outline-attention"
                    style={{ background: MOTIF_INCERTAIN }}
                  />
                  Fin incertaine
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-3.5 w-0.5 bg-corail" />
                  Votre limite
                </li>
              </ul>
            </div>

            {resultats.visibles.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 rounded-md border border-dashed border-contour px-5 py-7 text-center">
                <p className="font-editorial text-[26px] italic">Aucune séance ne correspond.</p>
                {filtresActifs ? (
                  <button
                    type="button"
                    onClick={() => {
                      parcours.modifierCriteres({ genres: [], auteur: '', masquerImpossibles: false });
                    }}
                    className="min-h-11 rounded-full border border-contour px-[18px] font-semibold hover:bg-surface-survol"
                  >
                    Retirer genre et auteur
                  </button>
                ) : (
                  <p className="text-sm text-texte-doux">Essayez un autre jour ou un départ plus tôt.</p>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-1 items-start gap-3 tablette:grid-cols-2">
                {resultats.visibles.map((resultat) => (
                  <li key={resultat.id}>
                    <CarteSeance
                      resultat={resultat}
                      criteres={criteres}
                      origineLibelle={origine}
                      onOuvrir={(identifiant) => {
                        parcours.ouvrirPiece({ type: 'seance', id: identifiant }, 'resultats', identifiant);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {nombreAvant === 0 ? null : (
              <p className="text-[13px] leading-[1.45] text-texte-doux">
                {pluriel(nombreAvant, 'séance commence', 'séances commencent')} avant votre départ de{' '}
                {formaterHeure(criteres.departMinutes)} et {nombreAvant > 1 ? 'ne sont pas listées' : 'n’est pas listée'} :{' '}
                {resultats.avantDepart.map((s) => `${s.titre} (${formaterHeure(s.debutMinutes)})`).join(', ')}.
              </p>
            )}
          </div>
        </main>
      </div>

      <FeuilleCriteres
        ouverte={parcours.feuilleOuverte}
        onFermer={parcours.fermerFeuille}
        libelleVoir={libelleBoutonVoir(resultats.visibles.length)}
        onVoir={parcours.fermerFeuille}
      >
        {formulaire}
      </FeuilleCriteres>
    </div>
  );
}
