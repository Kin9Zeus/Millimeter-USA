import type { APIRoute } from 'astro';

export const prerender = false;

// Railway health check. Reports whether email delivery is configured, never the value itself.
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: true, mail: Boolean(process.env.RESEND_API_KEY), time: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
