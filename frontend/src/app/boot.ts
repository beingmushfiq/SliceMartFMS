/**
 * BOOT BRIDGE — the typed seam between the inline loader in index.html and the
 * React shell.                                              UI_SYSTEM.md §7.5
 *
 * The tier-1 loader is plain inline script because it must paint in the first
 * frame, before any module executes. That makes `window.__boot` an untyped
 * global, which is exactly the kind of thing that rots. This module is the only
 * place allowed to touch it.
 *
 * Every function here is a no-op when the loader is absent — after `done()` the
 * loader deletes itself, and in tests and Storybook it never existed. Callers
 * must never have to guard.
 */

/** The milestones the rail knows about. Adding one here means adding a weight
 *  in the `STEPS` map in index.html — they are two halves of one contract. */
export type BootMilestone = 'parsed' | 'scripts' | 'auth' | 'tenant' | 'route';

interface BootApi {
  step(milestone: BootMilestone): void;
  done(): void;
  fail(message: string, correlationId?: string | null): void;
}

declare global {
  interface Window {
    __boot?: BootApi;
  }
}

/** Advance the rail. Real milestone, real progress — never a timer (§7.4). */
export function bootStep(milestone: BootMilestone): void {
  window.__boot?.step(milestone);
}

/**
 * Dismiss the loader. Call this after the first route has actually painted, not
 * when the router mounts — the point of the loader is to cover the gap until
 * there is something to look at.
 */
export function bootDone(): void {
  window.__boot?.done();
}

/**
 * Boot failed in a way React cannot recover from: auth transport unreachable,
 * tenant unresolvable, the shell threw before it could render its own error
 * surface. The loader stays and becomes the error state.
 *
 * `message` must be human-readable and safe to show a factory operator. The
 * correlation id is what support searches for, so it is surfaced verbatim.
 * Stack traces never appear here.
 */
export function bootFail(message: string, correlationId?: string | null): void {
  window.__boot?.fail(message, correlationId ?? null);
}

/** True while the loader is still on screen. Used to decide whether a failure
 *  should escalate through the loader or through an in-app error surface. */
export function isBooting(): boolean {
  return typeof window !== 'undefined' && window.__boot !== undefined;
}
