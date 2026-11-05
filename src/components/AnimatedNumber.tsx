import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/motion';

interface Props {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
}

/**
 * Rolls from the previous value to the new one. Screen readers get only the
 * final value, never the in-between frames.
 */
export function AnimatedNumber({ value, format, durationMs = 420 }: Props) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    if (reduced) {
      current.current = value;
      setShown(value);
      return;
    }

    const from = current.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      current.current = Math.round(from + (value - from) * eased);
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced, durationMs]);

  return (
    <span className="num">
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
