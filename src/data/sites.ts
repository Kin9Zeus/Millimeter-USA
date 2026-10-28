// Where MILLIMETER works, for the world map. Consolidated list from the client review of 25-oct-2026,
// which replaces every earlier map instruction. Four categories:
// - quarry: countries of origin of the stone (country-level points, not specific quarries).
// - fab: fabrication in Houston and Spain.
// - presence: commercial presence in the United States (Houston HQ), Spain, the United Arab Emirates and Colombia
//   (Colombia restored by the review of 28-oct, labelled with the country name).
// - dest: destinations named by the client (Netherlands has no city specified, so it is a country point).
export type Country = 'US' | 'ES' | 'AE' | 'CO' | 'IT' | 'PT' | 'BR' | 'IR' | 'TN' | 'CN' | 'IN' | 'PE';
export type Dest = 'LAX' | 'MIA' | 'NL' | 'PAR' | 'DXB' | 'SDQ' | 'MTY';
export interface Site { c: Country; lat: number; lon: number; city?: string; hq?: boolean; stones?: string[] }
export interface Destination { id: Dest; lat: number; lon: number }

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

// Stones listed only where the catalog names the origin; China, India and Peru are origins without a catalog stone yet.
export const QUARRIES: Site[] = [
  { c: 'IT', lat: 44.08, lon: 10.1, stones: ['Bianco Carrara', 'Verde Alpi', 'Cream Travertin Roman'] },
  { c: 'ES', lat: 38.4, lon: -1.0, stones: ['Nero Marquina', 'Rojo Levante'] },
  { c: 'PT', lat: 38.84, lon: -7.59, stones: ['Dark Rosa Portugués'] },
  { c: 'BR', lat: -20.0, lon: -41.0, stones: ['Taj Mahal', 'Patagonia'] },
  { c: 'IR', lat: 34.8, lon: 48.5, stones: ['Pietra Grey'] },
  { c: 'TN', lat: 35.6, lon: 8.7, stones: ['Sahara Noir'] },
  { c: 'CN', lat: 24.48, lon: 118.09 },
  { c: 'IN', lat: 27.03, lon: 74.72 },
  { c: 'PE', lat: -11.5, lon: -75.5 },
];

export const DESTINATIONS: Destination[] = [
  { id: 'LAX', lat: 34.05, lon: -118.24 },
  { id: 'MTY', lat: 25.67, lon: -100.31 },
  { id: 'MIA', lat: 25.76, lon: -80.19 },
  { id: 'SDQ', lat: 18.49, lon: -69.93 },
  { id: 'PAR', lat: 48.86, lon: 2.35 },
  { id: 'NL', lat: 52.37, lon: 4.9 },
  { id: 'DXB', lat: 25.2, lon: 55.27 },
];

/** Connections drawn as arcs. The client set no individual routes, so each origin feeds its nearest workshop
 *  and each workshop serves its own region: supply = quarry → workshop, delivery = workshop → destination. */
type Node = Country | Dest | 'HOU' | 'ESF';
export const SUPPLY: [Node, Node][] = [
  ['IT', 'ESF'], ['PT', 'ESF'], ['TN', 'ESF'], ['IR', 'ESF'], ['IN', 'ESF'], ['CN', 'ESF'],
  ['BR', 'HOU'], ['PE', 'HOU'], ['ESF', 'HOU'],
];
export const DELIVERY: [Node, Node][] = [
  ['HOU', 'LAX'], ['HOU', 'MTY'], ['HOU', 'MIA'], ['HOU', 'SDQ'],
  ['ESF', 'PAR'], ['ESF', 'NL'], ['ESF', 'DXB'],
];
