import type { PosterDesign, PosterShape } from '../domain/types';

interface Props {
  readonly poster: PosterDesign;
  readonly title: string;
  readonly author: string;
  /** Venue name, printed on the poster. */
  readonly venueName: string;
}

const percent = (n: number): string => `${String(n)}%`;

const TITLE_CLASSES = {
  editorial: 'font-editorial font-normal leading-[0.95] tracking-[-0.01em]',
  grotesque: 'font-sans font-extrabold uppercase leading-[0.9] tracking-[-0.02em]',
} as const;

function Shape({ shape }: { readonly shape: PosterShape }) {
  return (
    <span
      className="absolute block"
      style={{
        left: percent(shape.left),
        top: percent(shape.top),
        width: percent(shape.width),
        aspectRatio: String(shape.ratio),
        borderRadius: shape.kind === 'round' ? '50%' : '0',
        backgroundColor: shape.color,
        ...(shape.rotation === undefined ? {} : { transform: `rotate(${String(shape.rotation)}deg)` }),
        ...(shape.outline === undefined
          ? {}
          : { border: `${String(shape.outline.thickness)}cqw solid ${shape.outline.color}` }),
      }}
    />
  );
}

/**
 * Demo poster: two shapes and a title, composed in CSS. Text sizes are in `cqw`
 * (poster width) so the composition scales with the poster.
 * Decorative (`aria-hidden`): the title and the venue are announced by the neighbouring caption.
 */
export function Poster({ poster, title, author, venueName }: Props) {
  const { family, size, italic, atTop } = poster.title;
  return (
    <span
      aria-hidden="true"
      className="@container relative block aspect-[2/3] w-full overflow-hidden rounded-[2px]"
      style={{ backgroundColor: poster.background, color: poster.ink }}
    >
      <Shape shape={poster.shapeA} />
      <Shape shape={poster.shapeB} />
      <span className="absolute inset-0 flex flex-col p-[7cqw]">
        <span className="block text-[3.8cqw] font-bold tracking-[0.16em] uppercase">{author}</span>
        <span
          className={`block ${TITLE_CLASSES[family]}${italic ? ' italic' : ''}`}
          style={{ fontSize: `${String(size)}cqw`, margin: atTop ? '6cqw 0 auto' : 'auto 0 4cqw' }}
        >
          {title}
        </span>
        <span className="block text-[3.4cqw] font-medium tracking-[0.04em]">{venueName}</span>
      </span>
    </span>
  );
}
