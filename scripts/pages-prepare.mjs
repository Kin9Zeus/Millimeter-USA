// Adapts the static build (dist/client) to GitHub Pages hosting for the pre-launch preview.
// - Pages resolves `/es` to the `es/` directory, so `es.html` is mirrored to `es/index.html` (same for any page
//   that shares its name with a directory).
// - Precompressed .br/.gz siblings are dropped (Pages compresses on its own).
// - `.nojekyll` keeps underscore folders such as `_astro/` from being ignored.
import { readdirSync, statSync, existsSync, copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/client/', import.meta.url));
let mirrored = 0;
let dropped = 0;

(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (/\.(br|gz)$/.test(name)) { rmSync(p); dropped++; continue; }
    const sibling = name.endsWith('.html') ? join(dir, name.slice(0, -5)) : null;
    if (sibling && existsSync(sibling) && statSync(sibling).isDirectory() && !existsSync(join(sibling, 'index.html'))) {
      copyFileSync(p, join(sibling, 'index.html'));
      mirrored++;
    }
  }
})(root);

writeFileSync(join(root, '.nojekyll'), '');
console.log(`[pages] ${mirrored} directory index(es) mirrored, ${dropped} precompressed file(s) dropped`);
