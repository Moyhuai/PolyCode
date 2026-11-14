import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 直接访问 /tool/<lang>/ 时需要静态入口，未知路径用 404 兜底到单页应用
function spaFallback() {
  let root = '';
  let outDir = '';
  return {
    name: 'polycode-spa-fallback',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const source = path.join(outDir, 'index.html');
      if (!fs.existsSync(source)) return;

      // 为每个语言工具页生成 index.html，避免直接访问时返回 404
      const languagesUrl = pathToFileURL(path.join(root, 'src/data/languages.js')).href;
      const { LANGUAGES } = await import(languagesUrl);
      LANGUAGES.forEach((language) => {
        const dir = path.join(outDir, 'tool', language.id);
        fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(source, path.join(dir, 'index.html'));
      });

      fs.copyFileSync(source, path.join(outDir, '404.html'));
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
