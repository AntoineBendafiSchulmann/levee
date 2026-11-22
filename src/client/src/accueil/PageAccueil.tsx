import { useState } from 'react';

import { compterSeances } from '../domaine/programme';
import { formaterHeure, libelleJourCourt, libelleJourDu, libelleJourLong } from '../domaine/temps';
import type { CriteresSortie, JourIso, Salle, Spectacle } from '../domaine/types';
import { ActionsAccueil } from './ActionsAccueil';
import { CarrouselAffiches } from './CarrouselAffiches';
import { construireDiapos } from './diapos';

interface Props {
  readonly criteres: CriteresSortie;
  /** Jour courant : « ce soir » désigne ce jour-là. */
  readonly aujourdhui: JourIso;
  readonly spectacles: readonly Spectacle[];
  readonly salles: readonly Salle[];
}

function libelleNombre(nombre: number, quand: string): string {
  if (nombre === 0) {
    return `Aucune séance ${quand}`;
  }
  return `${String(nombre)} ${nombre > 1 ? 'séances' : 'séance'} ${quand}`;
}

/**
 * Accueil « Que voir ce soir ? ». Les destinations des lots suivants (liste des séances, édition des
 * critères, fiche séance) affichent pour l'instant un avis provisoire.
 */
export function PageAccueil({ criteres, aujourdhui, spectacles, salles }: Props) {
  const [avis, setAvis] = useState<string | null>(null);
  const diapos = construireDiapos(spectacles, salles, criteres.jour, aujourdhui);
  const quand = libelleJourDu(criteres.jour, aujourdhui);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-none items-center border-b border-filet px-4 py-1.5 tablette:px-6 tablette:py-2 bureau:px-8">
        <p className="flex min-h-11 items-center font-editorial text-[34px] leading-none italic">levee</p>
      </header>

      <main className="flex flex-1 flex-col bureau:grid bureau:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] bureau:grid-rows-[1fr_auto_auto_1fr] bureau:gap-x-6">
        <div className="flex flex-col gap-1.5 px-4 pt-2.5 tablette:px-6 tablette:pt-7 tablette:pb-2 bureau:col-start-1 bureau:row-start-2 bureau:pt-0 bureau:pr-0 bureau:pb-5 bureau:pl-14">
          <p className="text-xs leading-[1.2] font-semibold tracking-[0.14em] text-texte-doux uppercase">
            {libelleJourLong(criteres.jour)} · à l’affiche
          </p>
          <h1 className="font-editorial text-[40px] leading-[0.98] font-normal tracking-[-0.01em] tablette:text-[60px] bureau:text-[84px]">
            Que voir <span className="text-corail italic">ce soir</span> ?
          </h1>
        </div>

        <div className="flex flex-1 flex-col bureau:col-start-2 bureau:row-span-4 bureau:row-start-1">
          <CarrouselAffiches
            diapos={diapos}
            onActiver={(diapo) => {
              setAvis(`la fiche de « ${diapo.titre} » arrive dans un lot suivant.`);
            }}
          />
        </div>

        <div className="flex w-full max-w-[560px] flex-col px-4 pb-3 tablette:mx-auto tablette:px-6 tablette:pt-2 tablette:pb-7 bureau:col-start-1 bureau:row-start-3 bureau:mx-0 bureau:p-0 bureau:pl-14">
          <div role="status">
            {avis === null ? null : (
              <p className="mb-2 rounded-lg border border-dashed border-contour px-3 py-2 text-[13px] leading-snug text-texte-doux">
                <strong className="font-bold text-texte">Provisoire</strong> · {avis}
              </p>
            )}
          </div>
          <ActionsAccueil
            criteres={[
              { cle: 'Depuis', valeur: criteres.origine },
              { cle: '', valeur: libelleJourCourt(criteres.jour, aujourdhui) },
              { cle: 'Avant', valeur: formaterHeure(criteres.limiteMinutes) },
            ]}
            libelleVoir={`Voir les séances de ${quand}`}
            detailVoir={libelleNombre(compterSeances(spectacles, criteres.jour), quand)}
            onVoir={() => {
              setAvis('la liste des séances arrive au prochain lot.');
            }}
            onPreparer={() => {
              setAvis('la modification des critères arrive au prochain lot.');
            }}
          />
        </div>
      </main>
    </div>
  );
}
