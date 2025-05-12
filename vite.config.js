import { defineConfig } from 'vite';
import { resolve } from 'path';


export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        page1: resolve(__dirname, 'page1.html'),
        page2: resolve(__dirname, 'page2.html'),
        page3: resolve(__dirname, 'page3.html')
      },
    },
  },
})
