import { PageAccueil } from './accueil/PageAccueil';
import type { OptionsCriteres } from './criteres/FormulaireCriteres';
import { construireResultats } from './domaine/resultats';
import { joursDisponibles } from './domaine/programme';
import { DEMO_AUJOURDHUI, DEMO_AUTEURS_SUGGERES, DEMO_CRITERES_INITIAUX } from './donnees-demo/criteres.demo';
import { DEMO_ORIGINES } from './donnees-demo/origines.demo';
import { DEMO_SALLES } from './donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from './donnees-demo/spectacles.demo';
import { useParcours } from './parcours/useParcours';
import { PageResultats } from './resultats/PageResultats';

const OPTIONS: OptionsCriteres = {
  aujourdhui: DEMO_AUJOURDHUI,
  jours: joursDisponibles(DEMO_SPECTACLES),
  origines: DEMO_ORIGINES,
  auteursSuggeres: DEMO_AUTEURS_SUGGERES,
};

/**
 * Racine de composition : seul endroit qui importe les données de démonstration et qui porte l'état
 * du parcours. Les compteurs de l'accueil, la feuille de critères et les résultats viennent tous du
 * même calcul, donc des mêmes nombres. Le branchement au BFF remplacera ces imports sans toucher
 * aux composants.
 */
export function App() {
  const parcours = useParcours(DEMO_CRITERES_INITIAUX);
  const resultats = construireResultats(DEMO_SPECTACLES, DEMO_SALLES, parcours.criteres);

  return parcours.ecran === 'resultats' ? (
    <PageResultats parcours={parcours} aujourdhui={DEMO_AUJOURDHUI} options={OPTIONS} resultats={resultats} />
  ) : (
    <PageAccueil
      parcours={parcours}
      aujourdhui={DEMO_AUJOURDHUI}
      spectacles={DEMO_SPECTACLES}
      salles={DEMO_SALLES}
      options={OPTIONS}
      resultats={resultats}
    />
  );
}
