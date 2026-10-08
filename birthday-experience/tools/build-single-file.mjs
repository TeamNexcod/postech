// Builds onecompiler/index.html: one self-contained HTML file (CSS and all local modules
// inlined; three.js and GSAP still come from their CDNs) for editors such as OneCompiler
// that work best with a single file.
//
//   npm install --no-save esbuild
//   node tools/build-single-file.mjs
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = await build({
  entryPoints: [path.join(root, 'js/app.js')],
  bundle: true,
  format: 'esm',
  write: false,
  external: ['three', 'three/addons/*'],
  target: 'es2020',
  legalComments: 'inline',
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile(path.join(root, 'css/style.css'), 'utf8');
let html = await readFile(path.join(root, 'index.html'), 'utf8');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`index.html no longer contains: ${from}`);
  html = html.replace(from, () => to);
};
swap('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}</style>`);
swap('<script type="module" src="js/app.js"></script>', `<script type="module">\n${js}</script>`);
await mkdir(path.join(root, 'onecompiler'), { recursive: true });
await writeFile(path.join(root, 'onecompiler/index.html'), html);
console.log(`onecompiler/index.html written (${(html.length / 1024).toFixed(0)} KB)`);
