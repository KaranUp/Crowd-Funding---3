import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  base: '/', // Changed this line
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress the specific Safe adapter warning that's causing the build to fail
        if (warning.code === 'UNRESOLVED_IMPORT') {
          const warningMessage = warning.message || '';
          if (warningMessage.includes('safe-ethers-adapters') || 
              warningMessage.includes('safe-globalThis')) {
            return;
          }
        }
        warn(warning);
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});