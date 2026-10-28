// Route map: every page exists in every locale. Keys are stable page ids.
// English lives at the root; Spanish under /es and Arabic (right-to-left) under /ar.
export type Lang = 'en' | 'es' | 'ar';
export const LANGS: Lang[] = ['en', 'es', 'ar'];
export type PageId =
  | 'home' | 'technology' | 'applications' | 'materials' | 'projects'
  | 'casanova' | 'contact' | 'careers' | 'privacy' | 'cookies';

/** Pages that have a label in the navigation dictionary. */
export type NavId = 'technology' | 'applications' | 'materials' | 'projects' | 'casanova' | 'contact' | 'careers';

// Arabic keeps Latin (English) slugs: readable when shared, no percent-encoding in links or analytics.
const PATHS: Record<PageId, Record<Lang, string>> = {
  home: { en: '/', es: '/es', ar: '/ar' },
  technology: { en: '/technology', es: '/es/tecnologia', ar: '/ar/technology' },
  applications: { en: '/applications', es: '/es/aplicaciones', ar: '/ar/applications' },
  materials: { en: '/materials', es: '/es/materiales', ar: '/ar/materials' },
  projects: { en: '/projects', es: '/es/proyectos', ar: '/ar/projects' },
  casanova: { en: '/casanova', es: '/es/casanova', ar: '/ar/casanova' },
  contact: { en: '/contact', es: '/es/contacto', ar: '/ar/contact' },
  careers: { en: '/careers', es: '/es/empleo', ar: '/ar/careers' },
  privacy: { en: '/legal/privacy', es: '/es/legal/privacidad', ar: '/ar/legal/privacy' },
  cookies: { en: '/legal/cookies', es: '/es/legal/cookies', ar: '/ar/legal/cookies' },
};

/**
 * Deploy base path: '' in production (domain root), '/Millimeter-USA' for the GitHub Pages preview.
 * Derived from the path of PUBLIC_SITE_URL in astro.config.mjs.
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Root-relative URL of a static file in /public, e.g. asset('/favicon.svg'). */
export const asset = (p: string) => BASE + p;
/** Root-relative page URLs (base included): use these for every internal href. */
export const ROUTES = Object.fromEntries(
  Object.entries(PATHS).map(([id, by]) => [id, Object.fromEntries(Object.entries(by).map(([l, p]) => [l, p === '/' ? BASE + '/' : BASE + p]))]),
) as Record<PageId, Record<Lang, string>>;

export const route = (id: PageId, lang: Lang) => ROUTES[id][lang];
// Global brand: language codes without a region (hreflang, <html lang>).
export const LOCALE: Record<Lang, string> = { en: 'en', es: 'es', ar: 'ar' };
export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', es: 'es_ES', ar: 'ar_AR' };
export const LANG_NAME: Record<Lang, string> = { en: 'English', es: 'Español', ar: 'العربية' };
/** Short label for the header switcher. */
export const LANG_SHORT: Record<Lang, string> = { en: 'EN', es: 'ES', ar: 'AR' };
export const DIR: Record<Lang, 'ltr' | 'rtl'> = { en: 'ltr', es: 'ltr', ar: 'rtl' };

export const CONTACT = {
  email: 'info@millimeterbycasanova.com',
  whatsappDisplay: '+1 (346) 805-9663',
  whatsappE164: '+13468059663',
  whatsappLink: (text: string) => `https://wa.me/13468059663?text=${encodeURIComponent(text)}`,
  instagram: 'https://www.instagram.com/_casanovadesign_',
  instagramHandle: '@_casanovadesign_',
  /** Pinterest profile: the icon appears in the footer as soon as this is set. */
  pinterest: '',
  corporate: 'https://www.millimeterbycasanova.com',
  southAmerica: 'https://www.millimetersouthamerica.com',
  company: 'MILLIMETER Global LLC.',
  city: 'Houston',
  region: 'TX',
  country: 'US',
  /** Commercial presence (source: millimeterbycasanova.com). */
  presence: ['US', 'ES', 'AE', 'CO'] as const,
};
