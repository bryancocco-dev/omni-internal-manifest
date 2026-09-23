import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8100,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
