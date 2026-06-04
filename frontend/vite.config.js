import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('react-router-dom') || id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts';
          }
          if (id.includes('xlsx')) {
            return 'excel';
          }
          if (id.includes('jspdf')) {
            return 'pdf';
          }
          if (id.includes('socket.io-client')) {
            return 'socket';
          }
        }
      }
    }
  }
});
