// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
// Canonical origin, e.g. https://www.yourdomain.com — set PUBLIC_SITE_URL in Railway before building.
let SITE = env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
if (!SITE) {
  console.warn('\n[millimeter] PUBLIC_SITE_URL is not set: canonical URLs, sitemap and Open Graph will point to localhost.\n');
  SITE = 'http://localhost:4321';
}

// A path in the URL (e.g. https://user.github.io/Millimeter-USA for the static preview) becomes the base path.
const siteUrl = new URL(SITE);
const BASE = siteUrl.pathname.replace(/\/$/, '');

export default defineConfig({
  site: siteUrl.origin + BASE,
  base: BASE || '/',
  trailingSlash: 'never',
  // Pages are prerendered to static HTML; only /api/* routes run on the server (see server.mjs).
  output: 'static',
  adapter: node({ mode: 'middleware' }),
  build: { format: 'file', inlineStylesheets: 'auto' },
  compressHTML: true,
  // CSRF: our API routes verify Origin themselves (src/lib/server/forms.ts → sameOrigin), aware of Railway's proxy headers.
  security: { checkOrigin: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    build: { assetsInlineLimit: 0, cssCodeSplit: false },
  },
});
