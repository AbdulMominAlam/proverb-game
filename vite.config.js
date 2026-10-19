import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The embedding worker imports @huggingface/transformers, which needs ES module output.
  worker: { format: 'es' },
})
