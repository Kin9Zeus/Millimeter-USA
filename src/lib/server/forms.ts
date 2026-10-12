// Server-side helpers for the contact and careers endpoints.
// No database: submissions are validated, then emailed through Resend's HTTP API.

/* ---------- rate limiting (in-memory, per IP, sliding window) ---------- */
const buckets = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return true; }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  return false;
}

export function clientIp(request: Request, fallback?: string): string {
  // Railway terminates TLS and appends the real client to X-Forwarded-For.
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || fallback || 'unknown';
}

/* ---------- validation ---------- */
export const clean = (v: FormDataEntryValue | null, max: number) =>
  typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
export const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ');
export const isEmail = (v: string) => /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/.test(v) && v.length <= 160;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Bots fill the hidden field or submit faster than a human can type. */
export function looksAutomated(form: FormData): boolean {
  if (clean(form.get('website'), 200)) return true;
  const ts = Number(clean(form.get('ts'), 20));
  if (!ts) return false; // no-JS submissions have no timestamp: allow
  const elapsed = Date.now() - ts;
  return elapsed < 2500 || elapsed > 1000 * 60 * 60 * 24;
}

/* ---------- PDF checks (content, not extension) ---------- */
export async function checkPdf(file: File): Promise<{ ok: true; bytes: Uint8Array } | { ok: false }> {
  if (!file || file.size === 0 || file.size > 5 * 1024 * 1024) return { ok: false };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  if (!head.includes('%PDF-')) return { ok: false };
  const body = new TextDecoder('latin1').decode(bytes);
  // Reject encrypted files and active content (scripts, launch actions, embedded files, rich media, XFA forms).
  if (/\/Encrypt\b|\/JavaScript\b|\/JS\b|\/Launch\b|\/EmbeddedFile\b|\/RichMedia\b|\/XFA\b|\/AA\b/.test(body)) return { ok: false };
  return { ok: true, bytes };
}

/* ---------- email ---------- */
interface Mail {
  subject: string;
  replyTo: string;
  rows: [string, string][];
  message?: string;
  attachment?: { filename: string; content: Uint8Array };
}

export async function sendMail(env: Record<string, string | undefined>, mail: Mail): Promise<boolean> {
  const key = env.RESEND_API_KEY;
  const to = env.CONTACT_TO || 'info@millimeterbycasanova.com';
  const from = env.CONTACT_FROM || 'MILLIMETER USA <web@millimeterbycasanova.com>';
  if (!key) {
    console.error('[forms] RESEND_API_KEY is not set — submission not delivered.');
    return false;
  }
  const rowsHtml = mail.rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#6b6258;font:12px/1.4 Arial;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(k)}</td><td style="padding:6px 0;font:15px/1.5 Arial;color:#12100d">${escapeHtml(v)}</td></tr>`)
    .join('');
  const html = `<div style="background:#f1ece4;padding:24px"><div style="max-width:640px;margin:auto;background:#fff;padding:28px;border-top:3px solid #c8915a">
    <p style="font:12px Arial;letter-spacing:.18em;text-transform:uppercase;color:#8a5527;margin:0 0 16px">MILLIMETER USA · web</p>
    <table style="border-collapse:collapse">${rowsHtml}</table>
    ${mail.message ? `<p style="white-space:pre-wrap;font:15px/1.6 Arial;color:#12100d;border-top:1px solid #e6dfd3;margin-top:18px;padding-top:18px">${escapeHtml(mail.message)}</p>` : ''}
  </div></div>`;
  const text = mail.rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n') + (mail.message ? `\n\n${mail.message}` : '');

  const body: Record<string, unknown> = { from, to: [to], reply_to: mail.replyTo, subject: oneLine(mail.subject).slice(0, 180), html, text };
  if (mail.attachment) body.attachments = [{ filename: mail.attachment.filename, content: Buffer.from(mail.attachment.content).toString('base64') }];

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) console.error('[forms] Resend error', res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error('[forms] Resend request failed', err);
    return false;
  }
}

/* ---------- responses ---------- */
export function respond(request: Request, status: number, payload: Record<string, unknown>, redirectTo?: string) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  if (!wantsJson && redirectTo && status === 200) {
    return new Response(null, { status: 303, headers: { Location: redirectTo } });
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Only accept same-origin posts (CSRF defense for a cookie-less API). */
export function sameOrigin(request: Request, site: URL | undefined): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // older browsers / no-JS posts from the same page omit it rarely; other checks still apply
  try {
    const o = new URL(origin);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return o.host === host || (!!site && o.host === site.host) || o.hostname === 'localhost';
  } catch { return false; }
}
