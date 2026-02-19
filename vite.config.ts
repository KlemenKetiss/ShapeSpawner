import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './', // relative so it works on GitHub Pages at any path
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

