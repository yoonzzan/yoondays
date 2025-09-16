import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // This line might be needed for 'resolve'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    base: '/', // Use a forward slash for root path.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // The `define` block is completely removed or commented out.
  }
})