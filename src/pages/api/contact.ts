import type { APIRoute } from 'astro';
import { clean, oneLine, isEmail, looksAutomated, rateLimited, clientIp, sendMail, respond, sameOrigin } from '../../lib/server/forms';
import { ROUTES } from '../../i18n/routes';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  if (!sameOrigin(request, site)) return respond(request, 403, { ok: false, error: 'origin' });
  const ip = clientIp(request, clientAddress);
  if (rateLimited(`contact:${ip}`, 5, 10 * 60 * 1000)) return respond(request, 429, { ok: false, error: 'rate' });

  let form: FormData;
  try { form = await request.formData(); } catch { return respond(request, 400, { ok: false, error: 'body' }); }

  const lang = clean(form.get('lang'), 2) === 'es' ? 'es' : 'en';
  const back = `${ROUTES.contact[lang]}?sent=1`;
  // Silently accept bot submissions so they get no signal.
  if (looksAutomated(form)) return respond(request, 200, { ok: true }, back);

  const name = oneLine(clean(form.get('name'), 120));
  const email = oneLine(clean(form.get('email'), 160));
  const phone = oneLine(clean(form.get('phone'), 40));
  const company = oneLine(clean(form.get('company'), 160));
  const location = oneLine(clean(form.get('location'), 120));
  const role = oneLine(clean(form.get('role'), 80));
  const message = clean(form.get('message'), 5000);
  const consent = clean(form.get('consent'), 5) === 'yes';

  const fields: string[] = [];
  if (!name) fields.push('name');
  if (!isEmail(email)) fields.push('email');
  if (message.length < 10) fields.push('message');
  if (!consent) fields.push('consent');
  if (fields.length) return respond(request, 400, { ok: false, error: 'invalid', fields });

  const sent = await sendMail(import.meta.env.PROD ? process.env : { ...import.meta.env, ...process.env }, {
    subject: `[MILLIMETER USA] ${name}${company ? ` · ${company}` : ''}${location ? ` · ${location}` : ''}`,
    replyTo: email,
    rows: [
      ['Name', name], ['Email', email], ['Phone', phone], ['Company', company], ['Project location', location], ['Role', role],
      ['Language', lang.toUpperCase()], ['Consent', `Privacy policy accepted ${new Date().toISOString()}`],
    ],
    message,
  });
  if (!sent) return respond(request, 502, { ok: false, error: 'delivery' });
  return respond(request, 200, { ok: true }, back);
};

export const ALL: APIRoute = () => new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
