import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves the site at the domain root; GitHub Pages served it at /amit-sh/.
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/amit-sh/',
})
