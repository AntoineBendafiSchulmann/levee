interface Props {
  /** Fournie hors de l'accueil : le logo devient un lien de retour à l'accueil. */
  readonly onAccueil?: () => void;
}

const CLASSES_LOGO = 'flex min-h-11 items-center font-editorial text-[34px] leading-none italic';

export function EnTete({ onAccueil }: Props) {
  return (
    <header className="flex flex-none items-center border-b border-filet px-4 py-1.5 tablette:px-6 tablette:py-2 bureau:px-8">
      {onAccueil === undefined ? (
        <p className={CLASSES_LOGO}>levee</p>
      ) : (
        <a
          href="/"
          aria-label="levee, accueil"
          className={CLASSES_LOGO}
          onClick={(evenement) => {
            // Clic modifié (nouvel onglet, etc.) : on laisse le navigateur faire.
            if (evenement.button !== 0 || evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) {
              return;
            }
            evenement.preventDefault();
            onAccueil();
          }}
        >
          levee
        </a>
      )}
    </header>
  );
}
