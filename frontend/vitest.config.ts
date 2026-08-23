import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    /* Explicit rather than inherited from the default glob: tests live beside
       the code they cover, and nothing outside `src` is a test. */
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    /* Deliberately NOT `passWithNoTests`. An empty suite exiting 0 is a green
       CI badge that proves nothing — the same failure mode §8.5 rule 1 bans in
       the UI (faking success). If this repo ever has no tests, the gate should
       go red and someone should notice. */
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
