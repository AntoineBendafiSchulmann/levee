import { useEffect, useRef, useState } from 'react';

import { Affiche } from '../composants/Affiche';
import { Navbar } from '../composants/Navbar';
import type { OptionsCriteres } from '../criteres/FormulaireCriteres';
import { libelleGenre } from '../domaine/genres';
import { joursDisponibles } from '../domaine/programme';
import { resultatDeSeance } from '../domaine/resultats';
import { identifiantSeance, resoudrePagePiece } from '../domaine/seance';
import { formaterDuree, formaterHeure, libelleJourBref, libelleJourLong } from '../domaine/temps';
import type { CriteresSortie, JourIso, Salle, Spectacle } from '../domaine/types';
import { bookActionLabel } from '../bookings/bookingRules';
import type { Bookings } from '../bookings/useBookings';
import type { Parcours } from '../parcours/useParcours';
import { verdictSeance } from '../domaine/explication';
import { BORDURE_GROUPE, LIBELLE_STATUT, POINT_GROUPE, TEXTE_GROUPE } from '../composants/presentationStatut';
import { CalculHoraire } from './CalculHoraire';
import { ChoixSeance } from './ChoixSeance';

interface Props {
  readonly parcours: Parcours;
  readonly bookings: Bookings;
  readonly aujourdhui: JourIso;
  readonly spectacles: readonly Spectacle[];
  readonly salles: readonly Salle[];
  readonly options: OptionsCriteres;
}

function phraseDurees(spectacle: Spectacle): string {
  const { durees } = spectacle;
  const [premiere] = durees;
  if (premiere === undefined) {
    return 'Durée non annoncée par le théâtre.';
  }
  if (durees.length === 1) {
    return `Durée annoncée : ${formaterDuree(premiere.minutes)}.`;
  }
  const nombre = durees.length === 2 ? 'Deux durées annoncées' : `${String(durees.length)} durées annoncées`;
  return `${nombre} : ${durees.map((d) => `${formaterDuree(d.minutes)} (${d.source.toLowerCase()})`).join(', ')}.`;
}

/**
 * Page d'une pièce (« fiche » dans l'interface), avec sa séance choisie. Adresses : `/piece/:id` (séance présélectionnée d'après les
 * critères) et `/seances/:id` (séance précise). Choisir un autre horaire met l'adresse à jour, pour qu'un
 * rechargement affiche la même séance. Le bouton du bas réserve cette séance exacte (simulation).
 */
export function PagePiece({ parcours, bookings, aujourdhui, spectacles, salles, options }: Props) {
  const { criteres, cible } = parcours;
  const pagePiece = cible === null ? undefined : resoudrePagePiece(spectacles, salles, cible, criteres);

  return (
    <div className="flex h-dvh flex-col">
      <Navbar ecran="piece" date={libelleJourLong(criteres.jour)} onAccueil={parcours.retournerAccueil} onSeances={parcours.allerSeancesDuSoir} bookingCount={bookings.count} onOpenTickets={bookings.openTickets} />
      {pagePiece === undefined ? (
        <PieceIntrouvable parcours={parcours} />
      ) : (
        // La clé remet à zéro l'onglet de jour quand on passe à une autre pièce.
        <PieceOuverte
          key={pagePiece.spectacle.id}
          parcours={parcours}
          bookings={bookings}
          criteres={criteres}
          aujourdhui={aujourdhui}
          options={options}
          pagePiece={pagePiece}
        />
      )}
    </div>
  );
}

function PieceIntrouvable({ parcours }: { readonly parcours: Parcours }) {
  const titre = useRef<HTMLHeadingElement>(null);
  const focaliser = parcours.naviguee;
  useEffect(() => {
    if (focaliser) {
      titre.current?.focus({ preventScroll: true });
    }
  }, [focaliser]);
  const bouton = 'min-h-11 rounded-full border border-contour px-[18px] font-semibold hover:bg-surface-survol';
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col items-start gap-4 px-4 pt-8 tablette:px-6 bureau:px-8">
      <h1 ref={titre} tabIndex={-1} className="font-editorial text-[40px] leading-none outline-none">
        Fiche introuvable
      </h1>
      <p className="text-texte-doux">Cette pièce ou cette séance n’existe pas, ou n’est plus programmée.</p>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={parcours.retournerAccueil} className={bouton}>
          Retour à l’accueil
        </button>
        <button type="button" onClick={parcours.voirSeances} className={bouton}>
          Voir les séances
        </button>
      </div>
    </main>
  );
}

interface OuverteProps {
  readonly parcours: Parcours;
  readonly bookings: Bookings;
  readonly criteres: CriteresSortie;
  readonly aujourdhui: JourIso;
  readonly options: OptionsCriteres;
  readonly pagePiece: NonNullable<ReturnType<typeof resoudrePagePiece>>;
}

function PieceOuverte({ parcours, bookings, criteres, aujourdhui, options, pagePiece }: OuverteProps) {
  const { spectacle, salle, seance } = pagePiece;
  const titre = useRef<HTMLHeadingElement>(null);
  const focaliser = parcours.naviguee;
  const [jourChoisi, setJourChoisi] = useState<JourIso | null>(null);

  // Après une navigation (clic sur une affiche ou une carte, retour du navigateur), le focus passe au titre.
  useEffect(() => {
    if (focaliser) {
      titre.current?.focus({ preventScroll: true });
    }
  }, [focaliser]);

  const origine = options.origines.find((o) => o.id === criteres.origine)?.libelle ?? criteres.origine;
  const resultat = resultatDeSeance(spectacle, salle, seance, criteres);
  const { groupe, statut } = resultat.evaluation;
  const jours = joursDisponibles([spectacle]);
  const jourAffiche = jourChoisi !== null && jours.includes(jourChoisi) ? jourChoisi : seance.jour;
  const lignes = spectacle.seances
    .filter((s) => s.jour === jourAffiche)
    .sort((a, b) => a.debutMinutes - b.debutMinutes)
    .map((s) => {
      const r = resultatDeSeance(spectacle, salle, s, criteres);
      return { identifiant: r.id, seance: s, evaluation: r.evaluation };
    });
  const versResultats = parcours.provenancePiece === 'resultats';

  return (
    <>
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 pt-3 pb-7 tablette:px-6 tablette:pt-[18px] tablette:pb-9 bureau:px-8 bureau:pt-[22px] bureau:pb-10">
          <button
            type="button"
            aria-label={versResultats ? 'Retour aux résultats' : 'Retour à l’accueil'}
            onClick={parcours.retournerDePiece}
            className="min-h-11 self-start rounded-full border border-filet py-0 pr-4 pl-3 text-sm font-semibold hover:bg-surface-survol"
          >
            <span aria-hidden="true">←</span> {versResultats ? 'Résultats' : 'Accueil'}
          </button>

          <div className="grid grid-cols-1 items-start gap-6 tablette:grid-cols-[260px_minmax(0,1fr)] tablette:gap-8 bureau:grid-cols-[300px_minmax(0,1fr)] bureau:gap-12">
            <div className="flex min-w-0 flex-col gap-[18px]">
              <div className="w-[180px] shadow-[0_18px_36px_oklch(0.08_0.02_285/0.6)] tablette:w-full">
                <Affiche affiche={spectacle.affiche} titre={spectacle.titre} auteur={spectacle.auteur} salle={salle.nom} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-[0.14em] text-texte-doux uppercase">
                  {spectacle.auteur} · {spectacle.genres.map(libelleGenre).join(', ')}
                </p>
                <h1
                  ref={titre}
                  tabIndex={-1}
                  className="font-editorial text-[38px] leading-[0.98] font-normal text-pretty italic outline-none tablette:text-[40px] bureau:text-[54px]"
                >
                  {spectacle.titre}
                </h1>
                <p className="mt-1 text-base font-semibold">
                  {salle.nom} · {salle.quartier}
                </p>
                <p className="text-sm text-texte-doux">{salle.adresse}</p>
                <p className="mt-1.5 max-w-[46ch] text-base leading-normal text-pretty">{spectacle.synopsis}</p>
                <p className="text-sm text-texte-doux">{phraseDurees(spectacle)}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3 border-b-2 border-texte pb-2">
                <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase">Séances</h2>
                <p className="text-right text-[13px] text-texte-doux">
                  Depuis {origine} à {formaterHeure(criteres.departMinutes)} · sorti avant {formaterHeure(criteres.limiteMinutes)}
                </p>
              </div>
              <ChoixSeance
                jours={jours}
                jourAffiche={jourAffiche}
                aujourdhui={aujourdhui}
                lignes={lignes}
                identifiantChoisi={identifiantSeance(spectacle, seance)}
                onJour={setJourChoisi}
                onSeance={(identifiant) => {
                  setJourChoisi(null);
                  parcours.choisirSeance(identifiant);
                }}
              />
              <p
                aria-live="polite"
                className={`rounded-md border px-4 py-3.5 text-[15px] leading-snug text-pretty ${TEXTE_GROUPE[groupe]} ${BORDURE_GROUPE[groupe]}`}
              >
                {verdictSeance(resultat, criteres, origine)}
              </p>
              <CalculHoraire resultat={resultat} criteres={criteres} origineLibelle={origine} />
            </div>
          </div>
        </div>
      </main>

      <div className="flex-none border-t border-filet bg-surface">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-x-5 gap-y-1 px-4 pt-2.5 pb-3.5 tablette:px-6 bureau:px-8">
          <p className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className={`size-2 flex-none rounded-full ${POINT_GROUPE[groupe]}`} />
            <span className="font-bold">
              {libelleJourBref(seance.jour)} · {formaterHeure(seance.debutMinutes)}
            </span>
            <span className={TEXTE_GROUPE[groupe]}>{LIBELLE_STATUT[statut]}</span>
          </p>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              bookings.openBookingForm(identifiantSeance(spectacle, seance));
            }}
            className={`min-h-[54px] max-w-[420px] flex-[1_1_240px] rounded-full px-[22px] text-base font-extrabold ${
              groupe === 'possible' ? 'bg-corail text-fond hover:bg-corail-vif' : 'border border-texte hover:bg-surface-survol'
            }`}
          >
            {bookActionLabel(groupe)}
          </button>
        </div>
      </div>
    </>
  );
}
