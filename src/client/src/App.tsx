import { PageAccueil } from './accueil/PageAccueil';
import { DEMO_AUJOURDHUI, DEMO_CRITERES_INITIAUX } from './donnees-demo/criteres.demo';
import { DEMO_SALLES } from './donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from './donnees-demo/spectacles.demo';

/**
 * Racine de composition : seul endroit qui importe les données de démonstration.
 * Le branchement au BFF remplacera ces imports sans toucher aux composants.
 */
export function App() {
  return (
    <PageAccueil
      criteres={DEMO_CRITERES_INITIAUX}
      aujourdhui={DEMO_AUJOURDHUI}
      spectacles={DEMO_SPECTACLES}
      salles={DEMO_SALLES}
    />
  );
}
