import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /** Windows’ta localhost / IPv6 uyumu; tarayıcıdan erişim için */
    host: true,
    port: 8080,
    /** 8080 meşgulse bir sonraki boş portu kullan (strictPort: true bağlantı reddine yol açabiliyor) */
    strictPort: false,
  },
})
