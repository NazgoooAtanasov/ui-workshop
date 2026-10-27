import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: 'src/library.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rolldownOptions: {
      external: [/^react(?:\/|$)/],
    },
  },
});
