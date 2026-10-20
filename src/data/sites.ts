// Where MILLIMETER works, for the world map (client correction #15).
// - presence: commercial presence listed on millimeterbycasanova.com (USA, Spain, UAE, Colombia); Houston is HQ.
// - fab: fabrication in Houston and Spain (confirmed by the client team, Oct 2026).
// - quarry: countries of origin of the stones in the catalog (country-level, not specific quarries).
export type Country = 'US' | 'ES' | 'AE' | 'CO' | 'IT' | 'PT' | 'BR' | 'TR' | 'IR' | 'TN';
export interface Site { c: Country; lat: number; lon: number; city?: string; hq?: boolean; stones?: string[] }

export const PRESENCE: Site[] = [
  { c: 'US', lat: 29.76, lon: -95.37, city: 'Houston', hq: true },
  { c: 'ES', lat: 40.42, lon: -3.7 },
  { c: 'AE', lat: 25.2, lon: 55.27 },
  { c: 'CO', lat: 4.71, lon: -74.07 },
];

export const FAB: Site[] = [
  { c: 'US', lat: 29.76, lon: -95.37, city: 'Houston' },
  { c: 'ES', lat: 40.42, lon: -3.7 },
];

export const QUARRIES: Site[] = [
  { c: 'IT', lat: 44.08, lon: 10.1, stones: ['Calacatta Venatina', 'Bianco Carrara', 'Verde Alpi'] },
  { c: 'ES', lat: 38.4, lon: -1.0, stones: ['Nero Marquina', 'Dark Emperador', 'Rojo Levante'] },
  { c: 'PT', lat: 38.84, lon: -7.59, stones: ['Dark Rosa Portugués'] },
  { c: 'BR', lat: -20.0, lon: -41.0, stones: ['Taj Mahal', 'Patagonia'] },
  { c: 'TR', lat: 37.78, lon: 29.09, stones: ['Travertine'] },
  { c: 'IR', lat: 34.8, lon: 48.5, stones: ['Pietra Grey'] },
  { c: 'TN', lat: 35.6, lon: 8.7, stones: ['Sahara Noir'] },
];

/** Supply routes drawn as arcs: quarry → workshop → markets. */
export const ROUTES_MAP: [Country | 'HOU' | 'ESF', Country | 'HOU' | 'ESF'][] = [
  ['IT', 'ESF'], ['PT', 'ESF'], ['TR', 'ESF'], ['IR', 'ESF'], ['TN', 'ESF'], ['BR', 'HOU'],
  ['ESF', 'HOU'], ['HOU', 'CO'], ['ESF', 'AE'],
];
