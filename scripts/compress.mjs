// Post-build: write .br and .gz siblings for text assets in dist/client (served by server.mjs).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve('dist/client');
const EXT = new Set(['.html', '.css', '.js', '.svg', '.xml', '.txt', '.json', '.webmanifest']);
let n = 0, before = 0, after = 0;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!EXT.has(path.extname(p))) continue;
    const buf = fs.readFileSync(p);
    if (buf.length < 1024) continue;
    const br = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
    const gz = zlib.gzipSync(buf, { level: 9 });
    fs.writeFileSync(p + '.br', br);
    fs.writeFileSync(p + '.gz', gz);
    n++; before += buf.length; after += br.length;
  }
}
walk(ROOT);
console.log(`[compress] ${n} files: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (brotli)`);
