import { useEffect, useState } from 'react';

interface BffStatus {
  readonly service: string;
  readonly environment: string;
  readonly timestampUtc: string;
}

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly state: BffStatus }
  | { readonly status: 'error'; readonly message: string };

/*
 * `GET /bff/etat` answers `{ service, environnement, horodatageUtc }`. Those JSON names are a public contract and do not
 * change with the names used in the code: this function is the only place that knows them.
 */
function parseBffStatus(value: unknown): BffStatus | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'service' in value &&
    typeof value.service === 'string' &&
    'environnement' in value &&
    typeof value.environnement === 'string' &&
    'horodatageUtc' in value &&
    typeof value.horodatageUtc === 'string'
  ) {
    return { service: value.service, environment: value.environnement, timestampUtc: value.horodatageUtc };
  }
  return null;
}

async function fetchBffStatus(signal: AbortSignal): Promise<BffStatus> {
  // Relative URL: the request goes to the origin that served the page.
  const response = await fetch('/bff/etat', {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`L’API est injoignable ou en erreur (HTTP ${String(response.status)}).`);
  }
  const status = parseBffStatus(await response.json());
  if (status === null) {
    throw new Error('La réponse de l’API n’a pas la forme attendue.');
  }
  return status;
}

/** Technical check of the BFF, served on /technique: calls GET /bff/etat and shows the response. */
export function DiagnosticsPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const abandon = new AbortController();

    fetchBffStatus(abandon.signal).then(
      (state) => {
        setLoadState({ status: 'success', state });
      },
      (error: unknown) => {
        if (abandon.signal.aborted) {
          return;
        }
        setLoadState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue.',
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
      <StatusView loadState={loadState} />
    </main>
  );
}

function StatusView({ loadState }: { readonly loadState: LoadState }) {
  switch (loadState.status) {
    case 'loading':
      return <p role="status">Chargement de l’état de l’API…</p>;
    case 'error':
      return (
        <p role="alert" className="text-danger">
          Erreur : {loadState.message}
        </p>
      );
    case 'success':
      return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-texte-doux">Service</dt>
          <dd>{loadState.state.service}</dd>
          <dt className="text-texte-doux">Environnement</dt>
          <dd>{loadState.state.environment}</dd>
          <dt className="text-texte-doux">Horodatage UTC</dt>
          <dd>{loadState.state.timestampUtc}</dd>
        </dl>
      );
  }
}
