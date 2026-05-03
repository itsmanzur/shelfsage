import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: 'src/main.jsx',
        admin: 'src/admin.jsx',
      },
      output: {
        // Stable entry names (no hash) so PHP can enqueue by name.
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'admin' ? 'shelfsage-admin.js' : 'shelfsage-app.js';
        },
        // Stable chunk name — prevents browser breaking on rebuild.
        chunkFileNames: 'assets/shelfsage-chunk.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return '[name].css';
          }
          return '[name][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
