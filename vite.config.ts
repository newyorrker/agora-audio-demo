import { defineConfig } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "agora-rtc-sdk-ng": ["agora-rtc-sdk-ng"]
        }
      }
    }
  }
})
