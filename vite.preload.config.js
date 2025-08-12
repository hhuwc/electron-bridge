import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist/preload',
    lib: {
      entry: {
        main: resolve(__dirname, 'src/renderer/main/preload.js'),
        'mp-service': resolve(__dirname, 'src/renderer/mp-service/preload.js'),
        'mp-render': resolve(__dirname, 'src/renderer/mp-render/preload.js'),
      },
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        format: 'cjs',
        entryFileNames: '[name].cjs'
      }
    },
    minify: false,
    sourcemap: true,
    emptyOutDir: false
  }
});
