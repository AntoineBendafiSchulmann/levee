import { useEffect, useState } from 'react';

interface EtatBff {
  readonly service: string;
  readonly environnement: string;
  readonly horodatageUtc: string;
}

type Chargement =
  | { readonly statut: 'chargement' }
  | { readonly statut: 'succes'; readonly etat: EtatBff }
  | { readonly statut: 'erreur'; readonly message: string };

function estEtatBff(valeur: unknown): valeur is EtatBff {
  return (
    typeof valeur === 'object' &&
    valeur !== null &&
    'service' in valeur &&
    typeof valeur.service === 'string' &&
    'environnement' in valeur &&
    typeof valeur.environnement === 'string' &&
    'horodatageUtc' in valeur &&
    typeof valeur.horodatageUtc === 'string'
  );
}

async function lireEtatBff(signal: AbortSignal): Promise<EtatBff> {
  // URL relative : la requête part vers l'origine qui a servi la page.
  const reponse = await fetch('/bff/etat', {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!reponse.ok) {
    throw new Error(`L’API est injoignable ou en erreur (HTTP ${String(reponse.status)}).`);
  }
  const corps: unknown = await reponse.json();
  if (!estEtatBff(corps)) {
    throw new Error('La réponse de l’API n’a pas la forme attendue.');
  }
  return corps;
}

export function App() {
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  useEffect(() => {
    const abandon = new AbortController();

    lireEtatBff(abandon.signal).then(
      (etat) => {
        setChargement({ statut: 'succes', etat });
      },
      (erreur: unknown) => {
        if (abandon.signal.aborted) {
          return;
        }
        setChargement({
          statut: 'erreur',
          message: erreur instanceof Error ? erreur.message : 'Erreur inconnue.',
        });
      },
    );

    return () => {
      abandon.abort();
    };
  }, []);

  return (
    <main>
      <h1>Levée de réserves</h1>
      <h2>État de l’API</h2>
      <EtatAffiche chargement={chargement} />
    </main>
  );
}

function EtatAffiche({ chargement }: { readonly chargement: Chargement }) {
  switch (chargement.statut) {
    case 'chargement':
      return <p role="status">Chargement de l’état de l’API…</p>;
    case 'erreur':
      return <p role="alert">Erreur : {chargement.message}</p>;
    case 'succes':
      return (
        <dl>
          <dt>Service</dt>
          <dd>{chargement.etat.service}</dd>
          <dt>Environnement</dt>
          <dd>{chargement.etat.environnement}</dd>
          <dt>Horodatage UTC</dt>
          <dd>{chargement.etat.horodatageUtc}</dd>
        </dl>
      );
  }
}
