import type { APIRoute } from 'astro';
import { clean, oneLine, isEmail, looksAutomated, rateLimited, clientIp, sendMail, respond, sameOrigin, checkPdf } from '../../lib/server/forms';
import { ROUTES } from '../../i18n/routes';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  if (!sameOrigin(request, site)) return respond(request, 403, { ok: false, error: 'origin' });
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 6 * 1024 * 1024) return respond(request, 413, { ok: false, error: 'size', fields: ['cv'] });
  const ip = clientIp(request, clientAddress);
  // Stricter than the contact form: résumés are heavier and rarer.
  if (rateLimited(`careers:${ip}`, 3, 60 * 60 * 1000)) return respond(request, 429, { ok: false, error: 'rate' });

  let form: FormData;
  try { form = await request.formData(); } catch { return respond(request, 400, { ok: false, error: 'body' }); }

  const lang = clean(form.get('lang'), 2) === 'es' ? 'es' : 'en';
  const back = `${ROUTES.careers[lang]}?sent=1`;
  if (looksAutomated(form)) return respond(request, 200, { ok: true }, back);

  const name = oneLine(clean(form.get('name'), 120));
  const email = oneLine(clean(form.get('email'), 160));
  const location = oneLine(clean(form.get('location'), 120));
  const area = oneLine(clean(form.get('area'), 80));
  const message = clean(form.get('message'), 3000);
  const consent = clean(form.get('consent'), 5) === 'yes';
  const cv = form.get('cv');

  const fields: string[] = [];
  if (!name) fields.push('name');
  if (!isEmail(email)) fields.push('email');
  if (!consent) fields.push('consent');
  const pdf = cv instanceof File ? await checkPdf(cv) : { ok: false as const };
  if (!pdf.ok) fields.push('cv');
  if (fields.length) return respond(request, 400, { ok: false, error: 'invalid', fields });

  const safeName = name.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'candidate';
  const sent = await sendMail(import.meta.env.PROD ? process.env : { ...import.meta.env, ...process.env }, {
    subject: `[MILLIMETER USA · Careers] ${name}${area ? ` · ${area}` : ''}`,
    replyTo: email,
    rows: [
      ['Name', name], ['Email', email], ['City / state', location], ['Area', area],
      ['Language', lang.toUpperCase()], ['Consent', `Privacy policy and résumé processing accepted ${new Date().toISOString()}`],
    ],
    message,
    attachment: pdf.ok ? { filename: `CV-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`, content: pdf.bytes } : undefined,
  });
  if (!sent) return respond(request, 502, { ok: false, error: 'delivery' });
  return respond(request, 200, { ok: true }, back);
};

export const ALL: APIRoute = () => new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
