// Production server for Railway. Wraps Astro's Node middleware with:
//  - canonical host + HTTPS redirects (behind Railway's proxy)
//  - security headers (CSP with hashes of the only inline script, HSTS, etc.)
//  - long-lived caching for hashed assets and media
//  - precompressed Brotli/Gzip responses for text assets (created by scripts/compress.mjs)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { handler as astro } from './dist/server/entry.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(ROOT, 'dist', 'client');
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const SITE = process.env.PUBLIC_SITE_URL ? new URL(process.env.PUBLIC_SITE_URL) : null;
const IS_PROD = process.env.NODE_ENV !== 'development';
// HSTS and upgrade-insecure-requests only make sense when the canonical origin is HTTPS.
const SECURE = IS_PROD && SITE?.protocol === 'https:';

// Hash every inline (non-JSON) <script> found in the built pages so the CSP can stay 'self' + hashes.
function inlineScriptHashes() {
  const hashes = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['_astro', 'media'].includes(e.name)) walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const html = fs.readFileSync(p, 'utf8');
      for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
        if (m[1].trim()) hashes.add(`'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
      }
    }
  };
  try { walk(CLIENT); } catch {}
  return [...hashes];
}

const CSP = [
  "default-src 'self'",
  `script-src 'self' ${inlineScriptHashes().join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  ...(SECURE ? ['upgrade-insecure-requests'] : []),
].join('; ');

const SECURITY = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  ...(SECURE ? { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' } : {}),
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const MEDIA_TYPES = { '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf' };
const typeOf = (f) => TYPES[path.extname(f)] || MEDIA_TYPES[path.extname(f)] || 'application/octet-stream';

/** Resolve a URL path to a file inside dist/client (clean URLs → .html). Returns null if missing or outside. */
function resolveFile(urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return null; }
  if (rel.includes('\0')) return null;
  const candidates = rel === '/' ? ['/index.html'] : [rel, rel + '.html', rel + '/index.html'];
  for (const c of candidates) {
    const f = path.resolve(CLIENT, '.' + c);
    if (!f.startsWith(CLIENT + path.sep)) return null;
    if (path.basename(f).startsWith('.') && !c.startsWith('/.well-known/')) continue;
    try { if (fs.statSync(f).isFile()) return f; } catch {}
  }
  return null;
}

/** Stream a static file with ETag/Last-Modified and Range support (needed by Safari/iOS for <video>). */
function sendFile(req, res, file, status = 200) {
  const st = fs.statSync(file);
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  res.setHeader('Content-Type', typeOf(file));
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', st.mtime.toUTCString());
  res.setHeader('Accept-Ranges', 'bytes');
  if (status === 200 && req.headers['if-none-match'] === etag) { res.statusCode = 304; return res.end(); }
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
  if (status === 200 && range) {
    let start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : st.size - 1;
    if (!range[1]) end = st.size - 1;
    if (start > end || end >= st.size || start < 0) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.statusCode = status;
  res.setHeader('Content-Length', st.size);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

function cacheControl(urlPath) {
  if (urlPath.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (urlPath.startsWith('/media/')) return 'public, max-age=2592000, stale-while-revalidate=86400';
  if (/\.(png|ico|svg|webmanifest|jpg|webp|avif|woff2)$/.test(urlPath)) return 'public, max-age=604800';
  return 'public, max-age=0, must-revalidate';
}

/** Serve a precompressed variant (.br / .gz) of a text asset when the client accepts it. */
function tryPrecompressed(req, res, urlPath) {
  const accept = String(req.headers['accept-encoding'] || '');
  let rel = decodeURIComponent(urlPath);
  if (rel.endsWith('/')) rel += 'index';
  let file = path.join(CLIENT, rel);
  if (!file.startsWith(CLIENT)) return false;
  if (!path.extname(file)) file += '.html';
  const ext = path.extname(file);
  if (!TYPES[ext]) return false;
  for (const [enc, suffix] of [['br', '.br'], ['gzip', '.gz']]) {
    if (!accept.includes(enc)) continue;
    const p = file + suffix;
    if (fs.existsSync(p)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', TYPES[ext]);
      res.setHeader('Content-Encoding', enc);
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Content-Length', fs.statSync(p).size);
      if (req.method === 'HEAD') { res.end(); return true; }
      fs.createReadStream(p).pipe(res);
      return true;
    }
  }
  return false;
}

const server = http.createServer((req, res) => {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const url = new URL(req.url || '/', `${proto}://${host || 'localhost'}`);

  // Canonical host + HTTPS (skip health checks and local runs).
  if (IS_PROD && SITE && url.pathname !== '/api/health' && !host.startsWith('localhost') && !host.startsWith('127.0.0.1') && !host.endsWith('.railway.internal')) {
    if (host !== SITE.host || proto !== 'https') {
      res.writeHead(301, { Location: `${SITE.origin}${url.pathname}${url.search}` });
      return res.end();
    }
  }

  // Clean URLs: /about/ → /about (except root).
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    res.writeHead(301, { Location: url.pathname.replace(/\/+$/, '') + url.search });
    return res.end();
  }

  for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v);
  if (url.pathname.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  else res.setHeader('Cache-Control', cacheControl(url.pathname));

  const isRead = req.method === 'GET' || req.method === 'HEAD';
  if (isRead && !url.pathname.startsWith('/api/')) {
    const file = resolveFile(url.pathname);
    if (file) {
      if (!req.headers.range && tryPrecompressed(req, res, url.pathname)) return;
      return sendFile(req, res, file);
    }
  }

  // Server routes (/api/*). Anything else unmatched gets the custom 404 page.
  astro(req, res, () => {
    const notFound = path.join(CLIENT, '404.html');
    res.setHeader('Cache-Control', 'no-store');
    if (isRead && fs.existsSync(notFound)) return sendFile(req, res, notFound, 404);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  });
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.requestTimeout = 30_000;
server.listen(PORT, HOST, () => console.log(`[millimeter] listening on http://${HOST}:${PORT}`));

for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
