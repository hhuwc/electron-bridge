import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'flatten-output',
      generateBundle(options, bundle) {
        // 重新组织输出文件的路径
        Object.keys(bundle).forEach(fileName => {
          if (fileName.includes('src/renderer/main/index.html')) {
            const asset = bundle[fileName];
            delete bundle[fileName];
            bundle['main.html'] = asset;
          } else if (fileName.includes('src/renderer/webview/index.html')) {
            const asset = bundle[fileName];
            delete bundle[fileName];
            bundle['webview.html'] = asset;
          }
        });
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/main/index.html'),
        'mp-service': resolve(__dirname, 'src/renderer/mp-service/index.html'),
        'mp-render': resolve(__dirname, 'src/renderer/mp-render/index.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.html')) {
            return '[name].html';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    port: 3120,
    strictPort: true
  }
});
