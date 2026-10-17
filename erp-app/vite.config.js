import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Un solo archivo HTML: se publica en GitHub Pages (demos.novagrowth.solutions/emotional-reconstruction/)
// y funciona sin servidor ni internet (salvo las fuentes).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: { outDir: '../emotional-reconstruction', emptyOutDir: true },
});
