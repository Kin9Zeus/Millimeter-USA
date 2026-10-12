// Route map: every page exists in both locales. Keys are stable page ids.
export type Lang = 'en' | 'es' | 'fr';
export const LANGS: Lang[] = ['en', 'es', 'fr'];
export type PageId =
  | 'home' | 'technology' | 'applications' | 'materials' | 'projects'
  | 'casanova' | 'contact' | 'careers' | 'privacy' | 'cookies';

/** Pages that have a label in the navigation dictionary. */
export type NavId = 'technology' | 'applications' | 'materials' | 'projects' | 'casanova' | 'contact' | 'careers';

const PATHS: Record<PageId, Record<Lang, string>> = {
  home: { en: '/', es: '/es', fr: '/fr' },
  technology: { en: '/technology', es: '/es/tecnologia', fr: '/fr/technologie' },
  applications: { en: '/applications', es: '/es/aplicaciones', fr: '/fr/applications' },
  materials: { en: '/materials', es: '/es/materiales', fr: '/fr/materiaux' },
  projects: { en: '/projects', es: '/es/proyectos', fr: '/fr/projets' },
  casanova: { en: '/casanova', es: '/es/casanova', fr: '/fr/casanova' },
  contact: { en: '/contact', es: '/es/contacto', fr: '/fr/contact' },
  careers: { en: '/careers', es: '/es/empleo', fr: '/fr/carrieres' },
  privacy: { en: '/legal/privacy', es: '/es/legal/privacidad', fr: '/fr/legal/confidentialite' },
  cookies: { en: '/legal/cookies', es: '/es/legal/cookies', fr: '/fr/legal/cookies' },
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
export const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-US', fr: 'fr-US' };
export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', es: 'es_US', fr: 'fr_FR' };
export const LANG_NAME: Record<Lang, string> = { en: 'English', es: 'Español', fr: 'Français' };

export const CONTACT = {
  email: 'info@millimeterbycasanova.com',
  whatsappDisplay: '+1 (346) 805-9663',
  whatsappE164: '+13468059663',
  whatsappLink: (text: string) => `https://wa.me/13468059663?text=${encodeURIComponent(text)}`,
  instagram: 'https://www.instagram.com/_casanovadesign_',
  instagramHandle: '@_casanovadesign_',
  corporate: 'https://www.millimeterbycasanova.com',
  southAmerica: 'https://www.millimetersouthamerica.com',
  company: 'MILLIMETER Global LLC.',
  city: 'Houston',
  region: 'TX',
  country: 'US',
};
