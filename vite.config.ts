import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/ShapeSpawner/', // required for GitHub Pages (repo name)
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

