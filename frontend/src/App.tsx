import { useEffect } from 'react';
import { bootDone, bootStep } from './app/boot';

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
    /* The shell has painted. Two real milestones, then the loader retires. */
    bootStep('route');
    const id = requestAnimationFrame(() => bootDone());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="bg-base text-default flex min-h-dvh items-center justify-center p-6">
      <div className="animate-rise-in bg-surface border-default w-full max-w-md rounded-xl border p-6 shadow-md">
        <p className="text-muted text-2xs font-semibold tracking-[0.075em] uppercase">
          Phase 0 · Architecture
        </p>

        <h1 className="mt-2 text-xl font-bold">Platform bootstrapped</h1>

        <p className="text-muted mt-2 text-sm">
          The monorepo, design tokens and tooling baseline are in place. No product module has been
          built yet — Phase 1 (auth, tenancy, RBAC, design system) has not started.
        </p>

        <dl className="border-default mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t pt-4 text-sm">
          <dt className="text-subtle">Frontend</dt>
          <dd className="font-medium">React · Vite · Tailwind v4</dd>
          <dt className="text-subtle">Backend</dt>
          <dd className="font-medium">Laravel · modular monolith</dd>
          <dt className="text-subtle">Modules built</dt>
          <dd className="tabular font-medium">0 of 41</dd>
        </dl>
      </div>
    </main>
  );
}
