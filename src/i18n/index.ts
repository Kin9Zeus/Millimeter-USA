import en from './en';
import es from './es';
import ar from './ar';
import type { Lang } from './routes';

export const dicts = { en, es, ar };
export const t = (lang: Lang) => dicts[lang];
export * from './routes';
