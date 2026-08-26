import { useEffect } from 'react';
import { bootDone, bootStep } from './app/boot';
import CataloguePage from './pages/CataloguePage';

/**
 * APPLICATION ROOT — Phase 0 state.
 *
 * There is deliberately no router, no navigation and no dashboard here. Phase 1
 * owns the authenticated shell (auth, tenancy, RBAC, design system); until its
 * gate opens, inventing screens would violate the one rule this project cares
 * about most — no placeholder screens, no fake data, nothing that implies a
 * capability that does not exist (`TASK_PROTOCOL.md` §5).
 *
 * What this file does do is exercise the seven-file token cascade end to end, so
 * `tokens.*.css` is verifiable rather than merely written: every colour, space,
 * radius, shadow, duration and easing below resolves through the semantic layer.
 * If dark mode, density or reduced motion is wrong, it is wrong on this screen.
 */
export default function App() {
  useEffect(() => {
    bootStep('route');
    const id = requestAnimationFrame(() => bootDone());
    return () => cancelAnimationFrame(id);
  }, []);

  return <CataloguePage />;
}
