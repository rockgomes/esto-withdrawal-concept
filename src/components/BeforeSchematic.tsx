import type { ReactNode } from 'react';
import { findings, type FindingId } from '../content';
import { useInView } from '../hooks/useInView';

interface Props {
  active: FindingId | null;
  onActivate: (id: FindingId | null) => void;
}

/** Each redline: the mark drawn over the schematic, and where its number pin sits. */
const REDLINES: Record<FindingId, { mark: ReactNode; pin: [number, number] }> = {
  maxDefault: { mark: <circle cx="248" cy="199" r="19" pathLength={1} />, pin: [262, 170] },
  paidDefault: { mark: <ellipse cx="43" cy="249" rx="29" ry="18" pathLength={1} />, pin: [86, 230] },
  nextMonthOnly: {
    mark: <rect x="38" y="331" width="204" height="36" rx="8" pathLength={1} />,
    pin: [250, 330],
  },
  format: { mark: <path d="M84 176 q56 9 112 0" pathLength={1} />, pin: [206, 128] },
  loading: { mark: <path d="M34 262 C 8 270, 8 292, 22 300" pathLength={1} />, pin: [12, 262] },
};

/**
 * A wireframe of the current screen, described rather than copied, with the
 * findings drawn over it as designer redlines.
 */
export function BeforeSchematic({ active, onActivate }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={`before ${inView ? 'is-drawn' : ''} ${active ? 'has-active' : ''}`}>
      <figure className="before__figure">
        <svg viewBox="0 0 280 450" role="img" aria-label="Wireframe of the current withdrawal screen">
          <g className="wire">
            <path d="M244 24 l12 12 M256 24 l-12 12" />
            <rect x="40" y="62" width="200" height="14" rx="3" className="wire__fill" />
            <rect x="72" y="84" width="136" height="14" rx="3" className="wire__fill" />
            <circle cx="40" cy="150" r="15" />
            <path d="M33 150 h14" />
            <text x="140" y="161" textAnchor="middle" className="wire__amount">
              2,000 €
            </text>
            <circle cx="240" cy="150" r="15" />
            <path d="M233 150 h14 M240 143 v14" />
            <rect x="26" y="195" width="222" height="8" rx="4" className="wire__fill--strong" />
            <circle cx="248" cy="199" r="10" className="wire__thumb" />
            <rect x="26" y="240" width="34" height="18" rx="9" className="wire__fill--strong" />
            <circle cx="51" cy="249" r="6" className="wire__knob" />
            <rect x="70" y="243" width="70" height="12" rx="3" className="wire__fill" />
            <rect x="26" y="272" width="228" height="7" rx="3" className="wire__fill" />
            <rect x="26" y="286" width="220" height="7" rx="3" className="wire__fill" />
            <rect x="26" y="300" width="150" height="7" rx="3" className="wire__fill" />
            <rect x="52" y="340" width="176" height="7" rx="3" className="wire__fill" />
            <rect x="84" y="353" width="112" height="7" rx="3" className="wire__fill" />
            <rect x="26" y="392" width="228" height="40" rx="20" className="wire__fill--strong" />
          </g>
          {findings.map((finding, i) => {
            const { mark, pin } = REDLINES[finding.id];
            return (
              <g
                key={finding.id}
                className={`redline ${active === finding.id ? 'is-active' : ''}`}
                style={{ animationDelay: `${i * 160}ms` }}
              >
                <g className="redline__mark">{mark}</g>
                <circle cx={pin[0]} cy={pin[1]} r="10" className="redline__pin" />
                <text x={pin[0]} y={pin[1] + 4} textAnchor="middle" className="redline__num">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption>Current screen, redrawn as a wireframe. Not a screenshot.</figcaption>
      </figure>

      <ol className="before__list">
        {findings.map((finding, i) => (
          <li key={finding.id}>
            <button
              type="button"
              aria-pressed={active === finding.id}
              onMouseEnter={() => onActivate(finding.id)}
              onMouseLeave={() => onActivate(null)}
              onFocus={() => onActivate(finding.id)}
              onBlur={() => onActivate(null)}
              onClick={() => onActivate(active === finding.id ? null : finding.id)}
            >
              <span className="before__num">{i + 1}</span>
              <span className="before__text">
                <span>{finding.issue}</span>
                {/* Collapsed until hover, focus or tap. Still in the DOM, so screen readers get it. */}
                <span className="before__why">
                  <span>{finding.why}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
