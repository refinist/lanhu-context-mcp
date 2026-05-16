import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import VueRouter from 'vue-router/vite';

// https://vite.dev/config/
export default defineConfig({
  server: { port: 4173 },
  // @ts-ignore
  plugins: [VueRouter(), vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
