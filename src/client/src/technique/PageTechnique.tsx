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

/** Contrôle technique du BFF, servi sur /technique : appelle GET /bff/etat et affiche la réponse. */
export function PageTechnique() {
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
    <main className="mx-auto max-w-xl p-6">
      <h1 className="font-editorial text-4xl italic">levee</h1>
      <h2 className="mt-4 mb-3 text-lg font-semibold">État de l’API</h2>
      <EtatAffiche chargement={chargement} />
    </main>
  );
}

function EtatAffiche({ chargement }: { readonly chargement: Chargement }) {
  switch (chargement.statut) {
    case 'chargement':
      return <p role="status">Chargement de l’état de l’API…</p>;
    case 'erreur':
      return (
        <p role="alert" className="text-danger">
          Erreur : {chargement.message}
        </p>
      );
    case 'succes':
      return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-texte-doux">Service</dt>
          <dd>{chargement.etat.service}</dd>
          <dt className="text-texte-doux">Environnement</dt>
          <dd>{chargement.etat.environnement}</dd>
          <dt className="text-texte-doux">Horodatage UTC</dt>
          <dd>{chargement.etat.horodatageUtc}</dd>
        </dl>
      );
  }
}
