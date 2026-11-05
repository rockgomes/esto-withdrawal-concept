import { useReducedMotion } from '../hooks/motion';

const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 128;
const PATH = `M${CENTER} ${CENTER - RADIUS} A${RADIUS} ${RADIUS} 0 0 1 ${CENTER} ${CENTER + RADIUS} A${RADIUS} ${RADIUS} 0 0 1 ${CENTER} ${CENTER - RADIUS}`;

export const STEPS = [
  { href: '#problem', label: 'Problem' },
  { href: '#prototype', label: 'Prototype' },
  { href: '#spec', label: 'Spec' },
  { href: '#numbers', label: 'Numbers' },
] as const;

/** Clockwise from the top, one step every 90 degrees. */
const pointAt = (degrees: number, radius = RADIUS) => {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
};

/**
 * The job post's loop (discovery, prototype, spec, launch and follow-up) as
 * the page's table of contents. It draws itself once, then a signal keeps
 * travelling round it, because the loop never really ends.
 */
export function Loop() {
  const reduced = useReducedMotion();

  return (
    <nav className="loop" aria-label="Sections">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <path id="loop-path" className="loop__path" d={PATH} pathLength={1} />
        {[45, 135, 225, 315].map((deg) => {
          const { x, y } = pointAt(deg);
          return (
            <path
              key={deg}
              className="loop__arrow"
              d="M-5 -6 L3 0 L-5 6"
              transform={`translate(${x} ${y}) rotate(${deg})`}
              style={{ animationDelay: `${700 + deg * 3}ms` }}
            />
          );
        })}
        {!reduced && (
          <circle className="loop__signal" r={5}>
            <animateMotion dur="9s" begin="1.8s" repeatCount="indefinite" rotate="auto">
              <mpath href="#loop-path" />
            </animateMotion>
          </circle>
        )}
      </svg>
      <ol className="loop__steps">
        {STEPS.map((step, i) => {
          const { x, y } = pointAt(i * 90);
          return (
            <li
              key={step.href}
              style={{
                left: `${(x / SIZE) * 100}%`,
                top: `${(y / SIZE) * 100}%`,
                animationDelay: `${300 + i * 260}ms`,
              }}
            >
              <a href={step.href}>
                <span className="loop__index">0{i + 1}</span>
                {step.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
