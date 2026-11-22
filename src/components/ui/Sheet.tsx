import { useEffect, useId, useRef, type ReactNode } from 'react';

interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Sheet title, read by screen readers (`aria-labelledby`). */
  readonly title: string;
  /** Fixed area below the content (action buttons); absent: the sheet only has its content. */
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/*
 * Native modal sheet (<dialog>): focus trap, Escape, inert background and focus return to
 * the opening element are provided by the browser. Mobile: sheet rising from the bottom;
 * from 700 px up: 440 px side panel entering from the right and leaving to the right (the Y axis
 * is also neutralised in the starting state, otherwise it would arrive from the bottom-right corner).
 * Reduced motion: no transition.
 */
const CLASSES = [
  'm-0 max-h-[90%] w-full max-w-none flex-col overflow-hidden bg-surface p-0 text-texte open:flex',
  'fixed inset-x-0 top-auto bottom-0 rounded-t-2xl shadow-[0_0_60px_oklch(0.08_0.02_285/0.7)]',
  'tablette:inset-y-0 tablette:right-0 tablette:left-auto tablette:h-full tablette:max-h-none tablette:w-[440px] tablette:rounded-none',
  'translate-y-full open:translate-y-0 starting:open:translate-y-full',
  'tablette:translate-x-full tablette:translate-y-0 tablette:open:translate-x-0 tablette:starting:open:translate-x-full tablette:starting:open:translate-y-0',
  'transition-[translate,display,overlay] transition-discrete duration-[340ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
  'backdrop:bg-[oklch(0.1_0.02_285/0.62)] backdrop:transition-[background-color,display,overlay] backdrop:transition-discrete backdrop:duration-300 motion-reduce:backdrop:transition-none starting:open:backdrop:bg-transparent',
].join(' ');

/**
 * Shared wrapper of the criteria sheet and the bookings sheet: dialog opening and closing,
 * title, « Fermer » button, backdrop click, scrolling content area and fixed footer. It knows
 * neither criteria nor bookings: its content and footer come from the feature that uses it.
 * When the title changes while the sheet is open (another view of the same sheet), focus moves to the title:
 * the button that just disappeared does not leave the focus lost.
 */
export function Sheet({ open, onClose, title, footer, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const shownTitle = useRef<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
      // The title is focusable (view change) but the opening focus stays on « Fermer ».
      closeButton.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  useEffect(() => {
    if (open && shownTitle.current !== null && shownTitle.current !== title) {
      heading.current?.focus();
    }
    shownTitle.current = open ? title : null;
  }, [open, title]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={CLASSES}
      // Escape or programmatic close: the browser closes the sheet, the state must follow.
      onClose={onClose}
      // A click on the backdrop reaches the <dialog> itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex flex-none items-center justify-between gap-3 px-5 pt-[18px] pb-2.5">
        <h2 ref={heading} id={titleId} tabIndex={-1} className="font-editorial text-[30px] leading-none font-normal italic outline-none">
          {title}
        </h2>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-filet px-3.5 text-sm font-semibold hover:bg-surface-survol"
        >
          Fermer
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2.5 pb-6">{children}</div>
      {footer === undefined ? null : <div className="flex-none border-t border-filet px-5 pt-3 pb-[18px]">{footer}</div>}
    </dialog>
  );
}
