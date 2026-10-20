import type { ImageMetadata } from 'astro';

// Central registry of raster images (processed by astro:assets into AVIF/WebP srcsets).
const all = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.jpg', { eager: true });
export const asset = (path: string): ImageMetadata => {
  const hit = all[`../assets/${path}.jpg`];
  if (!hit) throw new Error(`Missing asset: ${path}`);
  return hit.default;
};

export const APP_IMG: Record<string, ImageMetadata> = Object.fromEntries(
  ['muros', 'chimeneas', 'arquitectonicos', 'duchas', 'mobiliario', 'puertas', 'curvas', 'techos'].map((k) => [k, asset(`applications/${k}`)]),
);

export const PROJECT_IMG = {
  wittman: {
    hero: asset('photos/vanity-1-and-5mm-wittman-ii'),
    gallery: [
      asset('photos/vanity-5mm-1mm-wittman'),
      asset('photos/vanity-5mm-1mm-wittman-01'),
      asset('photos/vanity-5mm-1mm-wittman-03'),
    ],
  },
  arch: {
    hero: asset('photos/arch-5mm-1mm-barret'),
    gallery: [asset('photos/arch-5mm-1mm-barret-02'), asset('photos/arch-5mm-1mm-barret-01')],
  },
  altuve: {
    hero: asset('photos/bar-cabinet-5mm-2cm-altuve-residence-03'),
    gallery: [
      asset('photos/bar-cabinet-5mm-2cm-altuve-residence-04'),
      asset('photos/bar-cabinet-5mm-2cm-altuve-residence-05'),
      asset('photos/bar-cabinet-5mm-2cm-altuve-residence'),
    ],
  },
} as const;

export const HERO = Object.fromEntries(
  ['home', 'technology', 'applications', 'materials', 'projects', 'casanova', 'contact', 'careers'].map((k) => [k, asset(`heroes/${k}`)]),
) as Record<'home' | 'technology' | 'applications' | 'materials' | 'projects' | 'casanova' | 'contact' | 'careers', ImageMetadata>;

/** Shop drawings for Projects → “From drawing to piece” (order matches projects.drawingsAlt). */
export const DRAWINGS = ['01-freestanding-sink', '02-cabinet-section', '03-bedside-table', '04-console', '05-closet-island'].map((k) => asset(`drawings/${k}`));

export const MISC = {
  jesus: asset('team/jesus-casanova'),
  jesusShowroom: asset('photos/foto-profesional-jesus-casanova-2'),
  jesusCasual: asset('photos/foto-profesional-jesus-casanova-3'),
  curveA: asset('scenes/curve-a'),
  curveB: asset('scenes/curve-b'),
  legacy: asset('scenes/legacy'),
  ceiling: asset('heroes/ceiling'),
  altuveDetail: asset('photos/bar-cabinet-5mm-2cm-altuve-residence-04'),
  // Client corrections, Oct 2026
  cta: asset('scenes/vanity'),
  warehouse: asset('scenes/warehouse'),
  quarry: asset('scenes/quarry'),
  closetIsland: asset('scenes/closet-island'),
  thinSheet: asset('scenes/thin-sheet'),
  bed: asset('photos/cream-travertine-bed'),
  console: asset('photos/console-02-5mm'),
  fireplace: asset('photos/fireplace-01-5mm-1mm'),
  kitchenIsland: asset('photos/kitchen-island-01-2cm-1mm'),
  kitchen: asset('photos/kitchen-03-2cm-1mm'),
  vanityGranite: asset('photos/delicatus-granite-vanity'),
};
