/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base: './' is non-negotiable — the production build must run from a static
// folder over file:// (USB stick) and later as a Kolibri HTML5App in a
// sandboxed iframe. Both require relative asset paths only.
//
// viteSingleFile inlines JS + CSS into a single self-contained index.html.
// This is what lets dist/index.html open directly over file:// — browsers
// (Chrome especially) block external `<script type="module">` over file:// for
// CORS reasons, which would otherwise leave a blank page from a USB stick. A
// single inlined file also drops cleanly into a Kolibri HTML5App ZIP.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    // Keep the bundle low-spec friendly and inspectable.
    target: 'es2020',
    sourcemap: false,
  },
  test: {
    // Data-layer/scoring/sequencing logic only — no UI snapshot tests.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    globals: true,
  },
});
