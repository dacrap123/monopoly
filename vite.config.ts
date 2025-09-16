
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages under https://dacrap123.github.io/monopoly/
export default defineConfig({
  plugins: [react()],
  base: '/monopoly/',
})
