import en from './en';
import es from './es';
import fr from './fr';
import type { Lang } from './routes';

export const dicts = { en, es, fr };
export const t = (lang: Lang) => dicts[lang];
export * from './routes';
