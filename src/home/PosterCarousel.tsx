import { useEffect, useEffectEvent, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import { onPlainClick } from '../components/plainClick';
import { pathForTarget } from '../navigation/routes';
import { STATUS_LABEL, GROUP_DOT, GROUP_TEXT } from '../components/statusPresentation';
import { Poster } from '../components/Poster';
import type { PosterSlide } from './posterSlides';
import { indexFromScroll, useCarousel, neighbours } from './useCarousel';
import { useDesktopBreakpoint } from './useDesktopBreakpoint';

interface Props {
  readonly slides: readonly PosterSlide[];
  /** Play active on mount (when coming back to the home page); read only once. */
  readonly readInitialPlayId: () => string | null;
  /** Called whenever the active play changes, so it can be remembered. */
  readonly onActivePlay: (id: string) => void;
  /** Opens the play's detail page. */
  readonly onOpenPlay: (slide: PosterSlide) => void;
  /** Opens the detail page of a given performance; `focusKey` identifies the element that regains focus on return. */
  readonly onOpenPerformance: (id: string, focusKey: string) => void;
  /** Page eyebrow and title, above the poster. */
  readonly intro: ReactNode;
  /** Criteria, main button and « Préparer une autre sortie ». */
  readonly actions: ReactNode;
  /** « Depuis République à 18h30 »: criteria reminder under the performances heading. */
  readonly criteriaRecap: string;
}

const ARROW_BUTTON =
  'grid size-11 place-items-center rounded-full border border-contour text-lg hover:bg-surface-survol aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-transparent';

const SHADOW = 'shadow-[0_18px_36px_oklch(0.08_0.02_285/0.6)]';

const twoDigits = (n: number) => String(n).padStart(2, '0');

/**
 * Plays on show: an active poster next to its text (title, venue, performances), and its neighbours.
 * A single selection (`index`) drives the title, the performances, the counter, the arrows and the opened
 * detail page; only the way it is changed depends on the screen size:
 *  - mobile and tablet (< 1100 px): native scrolling with snapping. The poster follows the finger, neighbours
 *    straighten up progressively, native snapping completes the gesture, vertical scrolling stays free. Mobile:
 *    poster centred between two neighbours, text below; tablet: poster on the left (280 px), text on the right;
 *  - desktop (≥ 1100 px): index-driven stage, central area capped at 1100 px, one neighbour on each side;
 *  - ultra-wide (≥ 2200 px): area capped at 1560 px, two neighbours on each side.
 * The first gesture (mouse or finger) on a neighbour makes it the active poster; the active poster opens its
 * detail page. With the keyboard, Enter on a neighbour opens its detail page directly. Moves stop at the edges.
 */
export function PosterCarousel({
  slides,
  readInitialPlayId,
  onActivePlay,
  onOpenPlay,
  onOpenPerformance,
  intro,
  actions,
  criteriaRecap,
}: Props) {
  const desktop = useDesktopBreakpoint();
  const playIds = slides.map((slide) => slide.id);
  const {
    index,
    activePlayId,
    direction,
    reduceMotion,
    goTo,
    followScroll,
    programmaticRef,
    moveBy,
    onKey,
    onPress,
    onRelease,
    hasSwiped,
    focusFollowsRef,
    canGoBack,
    canAdvance,
  } = useCarousel(playIds, readInitialPlayId);
  const active = slides[index];
  const root = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const posterBox = useRef<HTMLDivElement>(null);
  const textBox = useRef<HTMLDivElement>(null);
  const previous = useRef(activePlayId);
  /** Until this instant, a native scroll triggered by the program must not change the selection. */
  const ignoreScrollUntil = useRef(0);

  /** Distance between the centres of two adjacent posters in the scroller (poster width + gap). */
  const readSlideStepPx = (container: HTMLElement): number => {
    const [first, second] = container.querySelectorAll<HTMLElement>('[data-slide]');
    if (first === undefined) {
      return 0;
    }
    return second === undefined ? first.offsetWidth : second.offsetLeft - first.offsetLeft;
  };

  useEffect(() => {
    if (activePlayId !== null) {
      onActivePlay(activePlayId);
    }
  }, [activePlayId, onActivePlay]);

  // Below 1100 px, on mount, or when the list changes (criteria), the scroller restores the current selection:
  // it follows the play, not the index, so the same play stays centred if its position changes.
  const listKey = playIds.join('|');
  const restoreScroll = useEffectEvent(() => {
    const container = scroller.current;
    if (container !== null) {
      container.scrollLeft = index * readSlideStepPx(container);
    }
  });
  useLayoutEffect(() => {
    if (!desktop) {
      restoreScroll();
    }
  }, [desktop, listKey]);

  // Native scrolling: depth follows the gesture (the centred poster faces front, neighbours are tilted and
  // darkened) and selection = poster closest to the centre.
  const followPoster = useEffectEvent(() => {
    const container = scroller.current;
    if (container !== null && Date.now() >= ignoreScrollUntil.current) {
      followScroll(indexFromScroll(container.scrollLeft, readSlideStepPx(container), slides.length));
    }
  });
  useEffect(() => {
    const container = scroller.current;
    if (desktop || container === null) {
      return;
    }
    let frameId = 0;
    const applyDepth = () => {
      const middle = container.scrollLeft + container.clientWidth / 2;
      for (const slide of container.querySelectorAll<HTMLElement>('[data-slide]')) {
        const target = slide.querySelector<HTMLElement>('[data-depth]');
        if (target === null) {
          continue;
        }
        if (reduceMotion) {
          target.style.transform = '';
          target.style.filter = '';
          continue;
        }
        const delta = Math.max(-2, Math.min(2, (slide.offsetLeft + slide.offsetWidth / 2 - middle) / slide.offsetWidth));
        const distance = Math.min(Math.abs(delta), 1.5);
        target.style.transform = `perspective(900px) rotateY(${(-delta * 16).toFixed(2)}deg) scale(${(1 - distance * 0.1).toFixed(3)})`;
        target.style.filter = `brightness(${(1 - Math.min(distance, 1) * 0.35).toFixed(3)})`;
      }
    };
    const schedule = () => {
      if (frameId !== 0) {
        return;
      }
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        applyDepth();
        followPoster();
      });
    };
    applyDepth();
    container.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    return () => {
      container.removeEventListener('scroll', schedule);
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [desktop, reduceMotion, slides.length]);

  // Deliberate change (arrow, keyboard, thumbnail, click on a neighbour): the native scroll follows.
  useEffect(() => {
    if (!programmaticRef.current) {
      return;
    }
    programmaticRef.current = false;
    const container = scroller.current;
    if (desktop || container === null) {
      return;
    }
    ignoreScrollUntil.current = Date.now() + (reduceMotion ? 0 : 700);
    container.scrollTo({ left: index * readSlideStepPx(container), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [index, desktop, reduceMotion, programmaticRef]);

  // Poster change: focus follows with the keyboard, and the text (and, on the stage, the poster) slides in from the direction of travel.
  useEffect(() => {
    if (previous.current === activePlayId) {
      return;
    }
    previous.current = activePlayId;
    if (focusFollowsRef.current) {
      focusFollowsRef.current = false;
      if (activePlayId !== null) {
        root.current?.querySelector<HTMLElement>(`[data-slide][data-focus-key="${CSS.escape(activePlayId)}"]`)?.focus({ preventScroll: true });
      }
    }
    if (reduceMotion) {
      return;
    }
    if (desktop) {
      posterBox.current?.animate(
        [
          { opacity: 0, transform: `translateX(${String(direction * 56)}px) perspective(900px) rotateY(${String(-direction * 10)}deg) scale(0.96)` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    }
    textBox.current?.animate(
      [
        { opacity: 0, transform: `translateX(${String(direction * 22)}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 240, delay: 30, fill: 'backwards', easing: 'ease-out' },
    );
  }, [activePlayId, reduceMotion, direction, desktop, focusFollowsRef]);

  if (active === undefined) {
    return (
      <section aria-label="Pièces à l’affiche" className="flex flex-col gap-4 px-4 py-4 tablette:px-8">
        {intro}
        {actions}
      </section>
    );
  }

  const { before, after } = neighbours(index, slides.length, 2);
  const neighbour = (i: number) => slides[i];

  /** Click on a neighbour: mouse or finger → it becomes the active poster; keyboard (Enter, Space) → opens its detail page. */
  const onNeighbour = (i: number) => (event: MouseEvent<HTMLButtonElement>) => {
    const slide = neighbour(i);
    if (slide === undefined || hasSwiped()) {
      return;
    }
    if (event.detail === 0) {
      onOpenPlay(slide);
    } else {
      goTo(i);
    }
  };

  const neighbourColumn = (indices: readonly number[], side: 'left' | 'right') => (
    <div
      className={`hidden min-w-0 items-center gap-7 self-stretch overflow-hidden bureau:flex ultra:gap-12 ${side === 'left' ? 'justify-end pr-7 ultra:pr-12' : 'justify-start pl-7 ultra:pl-12'}`}
    >
      {indices.map((i) => {
        const slide = neighbour(i);
        if (slide === undefined) {
          return null;
        }
        const closest = Math.abs(i - index) === 1;
        return (
          <button
            key={slide.id}
            type="button"
            aria-label={`Mettre à l’affiche : ${slide.title}`}
            onClick={onNeighbour(i)}
            className={`flex w-[240px] flex-none flex-col gap-2.5 p-0 text-left transition-opacity motion-reduce:transition-none hover:opacity-100 ultra:w-[320px] ${closest ? 'opacity-50 ultra:opacity-60' : 'opacity-[0.38] ultra:w-[250px]'} ${closest ? '' : 'hidden ultra:flex'}`}
          >
            <span className={`block w-full ${SHADOW}`}>
              <Poster poster={slide.poster} title={slide.title} author={slide.author} venueName={slide.venueName} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-editorial text-[22px] leading-[1.05] italic">{slide.title}</span>
              <span className="text-sm font-bold">{slide.caption}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  /** Click on a scroller poster: mouse or finger → centre it first, open it if already centred; keyboard → opens it. */
  const onSlide = (i: number, event: MouseEvent<HTMLAnchorElement>) => {
    onPlainClick<HTMLAnchorElement>((click) => {
      const slide = slides[i];
      if (slide === undefined) {
        return;
      }
      if (click.detail === 0 || isCentered(click.currentTarget)) {
        onOpenPlay(slide);
      } else {
        goTo(i);
      }
    })(event);
  };

  const isCentered = (slide: HTMLElement): boolean => {
    const container = scroller.current;
    if (container === null) {
      return false;
    }
    const zone = container.getBoundingClientRect();
    const rect = slide.getBoundingClientRect();
    return Math.abs(rect.left + rect.width / 2 - (zone.left + zone.width / 2)) < 4;
  };

  return (
    <section
      ref={root}
      aria-roledescription="carrousel"
      aria-label="Pièces à l’affiche"
      onKeyDown={onKey}
      onPointerDown={desktop ? onPress : undefined}
      onPointerUp={desktop ? onRelease : undefined}
      className={`grid min-h-full grid-cols-1 content-center bureau:grid-cols-[minmax(0,1fr)_minmax(0,1100px)_minmax(0,1fr)] ultra:grid-cols-[minmax(0,1fr)_minmax(0,1560px)_minmax(0,1fr)] ${desktop ? 'touch-pan-y' : ''}`}
    >
      {desktop ? neighbourColumn(before, 'left') : null}

      <div className="flex min-w-0 flex-col gap-3 px-4 py-3 tablette:gap-[22px] tablette:px-8 tablette:py-7 bureau:gap-5 bureau:px-0 ultra:gap-7 ultra:py-14">
        {intro}
        <div className="grid gap-3 tablette:grid-cols-[280px_minmax(0,1fr)] tablette:items-start tablette:gap-9 bureau:grid-cols-[360px_minmax(0,1fr)] bureau:gap-[52px] ultra:grid-cols-[540px_minmax(0,1fr)] ultra:gap-24">
          <div className="flex min-w-0 flex-col gap-3.5">
            {desktop ? (
              <div ref={posterBox} className={`relative z-[2] ${SHADOW}`}>
                <a
                  href={pathForTarget({ type: 'play', id: active.id })}
                  data-slide=""
                  data-focus-key={active.id}
                  aria-label={`Ouvrir la fiche de ${active.title}`}
                  onClick={onPlainClick(() => {
                    // A click following a swipe (mouse or finger) opens nothing.
                    if (!hasSwiped()) {
                      onOpenPlay(active);
                    }
                  })}
                  className="block"
                >
                  <Poster poster={active.poster} title={active.title} author={active.author} venueName={active.venueName} />
                </a>
              </div>
            ) : (
              <div
                ref={scroller}
                className="relative -mx-4 flex snap-x snap-mandatory items-center gap-[18px] overflow-x-auto overflow-y-hidden pt-1 pb-1.5 [scrollbar-width:none] tablette:mx-0"
              >
                {slides.map((slide, i) => (
                  <a
                    key={slide.id}
                    href={pathForTarget({ type: 'play', id: slide.id })}
                    data-slide=""
                    data-focus-key={slide.id}
                    aria-label={`Ouvrir la fiche de ${slide.title}`}
                    // Only keyboard focus (Tab) centres the poster: the focus ring is never clipped. Focus
                    // given by mouse or finger moves nothing; centring then happens on click.
                    onFocus={(event) => {
                      if (event.currentTarget.matches(':focus-visible')) {
                        goTo(i);
                      }
                    }}
                    onClick={(event) => {
                      onSlide(i, event);
                    }}
                    className="block w-[190px] flex-none snap-center first:ml-[calc(50%-95px)] last:mr-[calc(50%-95px)] tablette:w-[280px] tablette:first:ml-0 tablette:last:mr-0"
                  >
                    <span data-depth="" className={`block w-full will-change-transform ${SHADOW}`}>
                      <Poster poster={slide.poster} title={slide.title} author={slide.author} venueName={slide.venueName} />
                    </span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 tablette:justify-start">
              <button
                type="button"
                aria-label="Affiche précédente"
                aria-disabled={!canGoBack}
                className={ARROW_BUTTON}
                onClick={() => {
                  moveBy(-1);
                }}
              >
                ←
              </button>
              <span className="min-w-[4.5rem] text-center text-[13px] font-semibold tracking-[0.06em] text-texte-doux">
                {twoDigits(index + 1)} / {twoDigits(slides.length)}
              </span>
              <button
                type="button"
                aria-label="Affiche suivante"
                aria-disabled={!canAdvance}
                className={ARROW_BUTTON}
                onClick={() => {
                  moveBy(1);
                }}
              >
                →
              </button>
              <span className="hidden text-xs text-texte-doux bureau:inline">← → au clavier</span>
            </div>

            <div role="group" aria-label="Toutes les pièces à l’affiche" className="hidden gap-2.5 tablette:flex ultra:gap-3.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`${slide.title}, ${slide.venueName}`}
                  aria-current={i === index}
                  onClick={() => {
                    goTo(i);
                  }}
                  className={`w-11 flex-none border-b-2 pb-1 transition-[opacity,translate] motion-reduce:transition-none ultra:w-[58px] ${i === index ? '-translate-y-1 border-corail' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <Poster poster={slide.poster} title={slide.title} author={slide.author} venueName={slide.venueName} />
                </button>
              ))}
            </div>
            <p role="status" className="sr-only">
              {`${String(index + 1)} sur ${String(slides.length)} : ${active.title}, ${active.venueName}`}
            </p>
          </div>

          <div ref={textBox} className="flex min-w-0 flex-col gap-[18px] tablette:gap-5 ultra:gap-7">
            <div className="order-1 flex flex-col gap-1.5">
              <p className="text-xs font-semibold tracking-[0.14em] text-texte-doux uppercase">{active.authorAndGenres}</p>
              <h2 className="font-editorial text-[40px] leading-none font-normal text-balance italic tablette:text-[52px] bureau:text-[66px] ultra:text-[108px]">
                {active.title}
              </h2>
              <p className="text-base font-semibold tablette:text-[17px] bureau:text-lg ultra:text-[22px]">{active.venueAndDistrict}</p>
              <p className="text-sm text-texte-doux">{active.addressAndDuration}</p>
            </div>

            <p className="order-4 max-w-[46ch] text-[15px] leading-normal text-pretty tablette:order-2 tablette:text-base ultra:text-[19px]">
              {active.synopsis}
            </p>

            <div className="order-3 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b-2 border-texte pb-2">
                <h3 className="text-[13px] font-bold tracking-[0.14em] uppercase">{active.performancesHeader}</h3>
                <p className="text-[13px] text-texte-doux">{criteriaRecap}</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {active.performances.map((performance) => (
                  <li key={performance.id}>
                    <a
                      href={pathForTarget({ type: 'performance', id: performance.id })}
                      data-focus-key={performance.focusKey}
                      onClick={onPlainClick(() => {
                        onOpenPerformance(performance.id, performance.focusKey);
                      })}
                      className={`flex min-h-[88px] min-w-[150px] flex-col gap-1 rounded-md border bg-surface px-3.5 py-3 hover:bg-surface-survol ${performance.isSuggested ? 'border-2 border-texte' : 'border-contour'}`}
                    >
                      <span className="sr-only">{active.title}, séance de </span>
                      <span className="text-[26px] leading-none font-extrabold tracking-[-0.03em] ultra:text-4xl">{performance.timeLabel}</span>
                      <span className="text-xs font-bold">{performance.exitLabel === null ? '→ sortie ?' : `→ sortie ${performance.exitLabel}`}</span>
                      <span className={`inline-flex items-center gap-[7px] text-[11px] font-bold tracking-[0.08em] uppercase ${GROUP_TEXT[performance.group]}`}>
                        <span aria-hidden="true" className={`size-2 flex-none rounded-full ${GROUP_DOT[performance.group]}`} />
                        {STATUS_LABEL[performance.status]}
                      </span>
                      {performance.isSuggested ? <span className="text-[11px] font-semibold text-texte-doux">Séance proposée</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={pathForTarget({ type: 'play', id: active.id })}
                onClick={onPlainClick(() => {
                  onOpenPlay(active);
                })}
                className="inline-flex min-h-11 items-center self-start text-[15px] font-bold underline underline-offset-4"
              >
                Voir la fiche de la pièce →
              </a>
            </div>

            <div className="order-2 flex flex-col gap-2 tablette:order-4 tablette:gap-2.5">{actions}</div>
          </div>
        </div>
      </div>

      {desktop ? neighbourColumn(after, 'right') : null}
    </section>
  );
}
