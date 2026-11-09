import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// GitHub Pages serves a project site from https://<user>.github.io/<repo-name>/,
// so every asset URL must be prefixed with '/<repo-name>/'.
// The deploy workflow sets BASE_PATH from actions/configure-pages, so the repo
// name never has to be hard-coded here. Locally, override it to test the subpath:
//   BASE_PATH=/airbnb-class-project/ npm run build && npm run preview
const DEFAULT_BASE = '/airbnb-class-project/';

function normalizeBase(raw: string | undefined): string {
  const base = (raw ?? DEFAULT_BASE).trim();
  if (base === '' || base === '/') return '/';
  return `/${base.replace(/^\/+|\/+$/g, '')}/`;
}

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
