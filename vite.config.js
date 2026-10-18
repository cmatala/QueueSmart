import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Sends any request starting with /api to the Express server on port 3001,
    // so the front end keeps running on one port and our fetch URLs stay
    // relative ('/api/services', not 'http://localhost:3001/api/services').
    //
    // Both have to be running, in two terminals:
    //   npm run dev      the front end on 5173
    //   npm run server   the back end on 3001
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
