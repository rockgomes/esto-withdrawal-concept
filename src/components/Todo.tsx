import type { ReactNode } from 'react';

/**
 * A visible placeholder for something only Rock can write. Kept loud on
 * purpose, so none of them ships by accident.
 */
export function Todo({ children }: { children: ReactNode }) {
  return <mark className="todo">{children}</mark>;
}
