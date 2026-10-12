import type { APIRoute } from 'astro';
import { ROUTES, LANGS, LOCALE, type PageId } from '../i18n/routes';

// Sitemap with hreflang alternates (localized slugs differ per language, so it is built by hand).
const PRIORITY: Record<PageId, string> = {
  home: '1.0', technology: '0.9', applications: '0.9', materials: '0.9', projects: '0.8', casanova: '0.8',
  contact: '0.8', careers: '0.4', privacy: '0.2', cookies: '0.2',
};
const BUILT = new Date().toISOString().slice(0, 10);

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(site!).origin + p; // ROUTES already include the base path
  const urls = (Object.keys(ROUTES) as PageId[]).flatMap((id) =>
    LANGS.map((lang) => `  <url>
    <loc>${abs(ROUTES[id][lang])}</loc>
    <lastmod>${BUILT}</lastmod>
    <priority>${PRIORITY[id]}</priority>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${LOCALE[l]}" href="${abs(ROUTES[id][l])}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(ROUTES[id].en)}"/>
  </url>`),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
