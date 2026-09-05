/**
 * Utility for circular ripple / view-transition theme toggling.
 * Starts an expanding circular animation from the exact coordinates of the user's click.
 */
export function toggleThemeWithTransition(
  currentTheme: 'light' | 'dark',
  event?: React.MouseEvent | MouseEvent,
  onApplied?: (next: 'light' | 'dark') => void
): 'light' | 'dark' {
  const next: 'light' | 'dark' = currentTheme === 'dark' ? 'light' : 'dark';

  const applyTheme = () => {
    try {
      localStorage.setItem('ui.theme', next);
      localStorage.setItem('theme', next);
    } catch {}

    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    onApplied?.(next);
  };

  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const doc = typeof document !== 'undefined' ? (document as unknown as {
    startViewTransition?: (callback: () => void) => {
      ready: Promise<void>;
    };
  }) : null;

  // If View Transitions API is not supported or reduced motion is preferred, apply immediately
  if (!doc?.startViewTransition || isReducedMotion) {
    applyTheme();
    return next;
  }

  // Calculate coordinates from the click or element center
  let x = window.innerWidth;
  let y = 0;

  if (event) {
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
      x = event.clientX;
      y = event.clientY;
    } else if (event.currentTarget instanceof HTMLElement) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  try {
    const transition = doc.startViewTransition(() => {
      applyTheme();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    }).catch(() => {
      applyTheme();
    });
  } catch {
    applyTheme();
  }

  return next;
}
