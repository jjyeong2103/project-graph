import { resolve } from 'path'
import { defineConfig } from 'vite'


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        page1: resolve(__dirname, 'page1.html'),
      },
    },
  },
})
