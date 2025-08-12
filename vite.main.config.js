import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist/main',
    lib: {
      entry: resolve(__dirname, 'src/main/main.js'),
      name: 'main',
      fileName: 'main',
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['electron', 'fs', 'path', 'os', 'url'],
      output: {
        format: 'cjs'
      }
    },
    minify: false,
    sourcemap: true,
    emptyOutDir: false
  }
});
