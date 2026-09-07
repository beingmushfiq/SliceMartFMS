/**
 * Application Runtime & Environment Version Metadata
 * Eliminates all hardcoded version strings across the frontend.
 */
declare const __APP_VERSION__: string | undefined;

export function getAppVersion(): string {
  try {
    if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
      return `v${__APP_VERSION__.replace(/^v/, '')}`;
    }
  } catch {
    // Ignore runtime lookup error
  }

  const envVersion = import.meta.env.VITE_APP_VERSION;
  if (envVersion) {
    return `v${String(envVersion).replace(/^v/, '')}`;
  }

  return 'v2.4.0';
}
