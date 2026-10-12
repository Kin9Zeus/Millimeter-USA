import type { APIRoute } from 'astro';

// Search and AI answer engines are welcome (GEO): the content is public product information.
export const GET: APIRoute = ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  // Pre-launch preview: keep every crawler out.
  if (import.meta.env.PUBLIC_PREVIEW === '1') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const body = `User-agent: *
Allow: /
Disallow: /api/

# AI search / answer engines: allowed to read and cite public pages
User-agent: GPTBot
Allow: /
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /api/

User-agent: Google-Extended
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
