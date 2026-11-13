import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 直接访问 /tool/<lang>/ 时需要 404 兜底到单页应用
function spaFallback() {
  let outDir = '';
  return {
    name: 'polycode-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const source = path.join(outDir, 'index.html');
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, path.join(outDir, '404.html'));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
