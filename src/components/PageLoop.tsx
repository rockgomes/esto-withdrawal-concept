import { useEffect, useRef, type ReactNode } from 'react';

/** Matches the dot grid on body, so the dots line up after the reset. */
const GRID = 24;

interface Props {
  /** The real top of the page, where the reader lands after the reset. */
  start: React.RefObject<HTMLElement | null>;
  /** A copy of the top of the page, one screen tall. */
  children: ReactNode;
}

/**
 * Makes the page a loop. After the footer comes a copy of the top of the
 * page. When the copy reaches the top of the screen, the page scrolls back by
 * exactly the distance between copy and original, so nothing visibly moves.
 * You cannot scroll up past the real top, so the loop only runs forward.
 */
export function PageLoop({ start, children }: Props) {
  const spacer = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

    // Keep the distance a multiple of the grid, or the dot background would shift.
    const align = () => {
      if (!spacer.current || !copy.current || !start.current) return;
      spacer.current.style.height = '0px';
      const distance = docTop(copy.current) - docTop(start.current);
      spacer.current.style.height = `${(GRID - (distance % GRID)) % GRID}px`;
    };

    const onScroll = () => {
      if (!copy.current || !start.current) return;
      const distance = docTop(copy.current) - docTop(start.current);
      if (distance > 0 && window.scrollY >= distance) {
        window.scrollTo({ top: window.scrollY - distance, behavior: 'instant' });
      }
    };

    align();
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(align) : null;
    resize?.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      resize?.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [start]);

  return (
    <>
      <div ref={spacer} aria-hidden="true" />
      {/* Hidden from screen readers and the keyboard: it only exists to be seen. */}
      <div ref={copy} className="page-loop" aria-hidden="true" inert>
        {children}
      </div>
    </>
  );
}
