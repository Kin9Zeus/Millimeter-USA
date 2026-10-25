import type { ImageMetadata } from 'astro';

// Stone library. The gallery is exactly the client's Drive folder «Materiales» (review 21-oct #3):
// images are produced by `npm run media` (materials step) into src/assets/materials/<id>.jpg.
const img = import.meta.glob<{ default: ImageMetadata }>('../assets/materials/*.jpg', { eager: true });
const m = (id: string) => {
  const hit = img[`../assets/materials/${id}.jpg`];
  if (!hit) throw new Error(`Missing material image: ${id}`);
  return hit.default;
};

export type Kind = 'marble' | 'quartzite' | 'travertine' | 'terrazzo';
export interface Material {
  id: string;
  name: string;
  kind: Kind;
  image: ImageMetadata;
  featured?: boolean;
  /** Short tonal description used in alt text (EN / ES / AR). */
  tone: { en: string; es: string; ar: string };
}

// Names and kinds follow the client's files; spelling corrections confirmed by the client:
// Cappuccino, Cream Travertin Roman (review 21-oct #4), Dark Rosa Portugués, Verde Alpi.
// The eight featured stones come from the client's preference document.
const list: Omit<Material, 'image'>[] = [
  { id: 'azure-white', name: 'Azure White', kind: 'marble', featured: true, tone: { en: 'white with grey-blue and honey veining', es: 'blanco con vetas gris azulado y miel', ar: 'أبيض بعروق رمادية مزرقة وعسلية' } },
  { id: 'bianco-carrara', name: 'Bianco Carrara', kind: 'marble', tone: { en: 'soft white with fine grey veining', es: 'blanco suave con veta gris fina', ar: 'أبيض ناعم بعروق رمادية دقيقة' } },
  { id: 'cappuccino', name: 'Cappuccino', kind: 'quartzite', featured: true, tone: { en: 'flowing brown and white waves', es: 'ondas fluidas marrón y blanco', ar: 'تموجات انسيابية بنية وبيضاء' } },
  { id: 'cream-travertin-roman', name: 'Cream Travertin Roman', kind: 'travertine', featured: true, tone: { en: 'warm cream with linear banding', es: 'crema cálido con bandas lineales', ar: 'كريمي دافئ بخطوط طولية' } },
  { id: 'cream-terrazzo', name: 'Cream Terrazzo', kind: 'terrazzo', tone: { en: 'cream, blush and sage fragments', es: 'fragmentos crema, rosados y salvia', ar: 'شظايا بلون الكريم والوردي والأخضر الفاتح' } },
  { id: 'cristallo-lagoon', name: 'Cristallo Lagoon', kind: 'quartzite', tone: { en: 'turquoise and green crystalline', es: 'cristalino turquesa y verde', ar: 'بلوري فيروزي وأخضر' } },
  { id: 'cristallo', name: 'Cristallo', kind: 'quartzite', tone: { en: 'translucent white crystalline', es: 'blanco cristalino translúcido', ar: 'أبيض بلوري شفاف' } },
  { id: 'daino-reale', name: 'Daino Reale', kind: 'marble', tone: { en: 'warm beige with soft veining', es: 'beige cálido con veta suave', ar: 'بيج دافئ بعروق ناعمة' } },
  { id: 'dark-rosa-portugues', name: 'Dark Rosa Portugués', kind: 'marble', tone: { en: 'lilac grey with rose clouds', es: 'gris lila con nubes rosadas', ar: 'رمادي ليلكي بغيوم وردية' } },
  { id: 'earl-white', name: 'Earl White', kind: 'marble', featured: true, tone: { en: 'white with grey and taupe waves', es: 'blanco con ondas grises y topo', ar: 'أبيض بتموجات رمادية وبنية فاتحة' } },
  { id: 'four-season', name: 'Four Season', kind: 'quartzite', tone: { en: 'white with rust and charcoal strata', es: 'blanco con estratos óxido y carbón', ar: 'أبيض بطبقات بلون الصدأ والفحم' } },
  { id: 'green-patek', name: 'Green Patek', kind: 'marble', tone: { en: 'white with green and black waves', es: 'blanco con ondas verdes y negras', ar: 'أبيض بتموجات خضراء وسوداء' } },
  { id: 'grey-terrazzo', name: 'Grey Terrazzo', kind: 'terrazzo', tone: { en: 'grey with light stone chips', es: 'gris con lascas de piedra claras', ar: 'رمادي بقطع حجرية فاتحة' } },
  { id: 'grey-travertine', name: 'Grey Travertine', kind: 'travertine', tone: { en: 'taupe grey with linear banding', es: 'gris topo con bandas lineales', ar: 'رمادي توبي بخطوط طولية' } },
  { id: 'greyish-pink', name: 'Greyish Pink', kind: 'marble', tone: { en: 'blush and grey waves', es: 'ondas rosadas y grises', ar: 'تموجات وردية ورمادية' } },
  { id: 'lilac', name: 'Lilac', kind: 'marble', tone: { en: 'white with dark smoky veining', es: 'blanco con veta oscura ahumada', ar: 'أبيض بعروق داكنة مدخّنة' } },
  { id: 'nero-marquina', name: 'Nero Marquina', kind: 'marble', tone: { en: 'deep black with white veins', es: 'negro profundo con vetas blancas', ar: 'أسود عميق بعروق بيضاء' } },
  { id: 'new-capanelli', name: 'New Capanelli', kind: 'marble', featured: true, tone: { en: 'white with bold aubergine veining', es: 'blanco con vetas berenjena intensas', ar: 'أبيض بعروق باذنجانية جريئة' } },
  { id: 'nidali', name: 'Nidali', kind: 'marble', tone: { en: 'sweeping green, pink and cream bands', es: 'bandas amplias verdes, rosas y crema', ar: 'أشرطة عريضة خضراء ووردية وكريمية' } },
  { id: 'oreo', name: 'Oreo', kind: 'marble', tone: { en: 'white with bold black strata', es: 'blanco con estratos negros marcados', ar: 'أبيض بطبقات سوداء واضحة' } },
  { id: 'patagonia', name: 'Patagonia', kind: 'quartzite', featured: true, tone: { en: 'cream with dark crystalline inclusions', es: 'crema con inclusiones cristalinas oscuras', ar: 'كريمي بتضمينات بلورية داكنة' } },
  { id: 'pietra-grey', name: 'Pietra Grey', kind: 'marble', tone: { en: 'charcoal grey with fine white lines', es: 'gris carbón con líneas blancas finas', ar: 'رمادي فحمي بخطوط بيضاء دقيقة' } },
  { id: 'rojo-levante', name: 'Rojo Levante', kind: 'marble', tone: { en: 'oxblood red with white veins', es: 'rojo intenso con vetas blancas', ar: 'أحمر داكن بعروق بيضاء' } },
  { id: 'rojo-travertino', name: 'Rojo Travertino', kind: 'travertine', tone: { en: 'rust red with horizontal banding', es: 'rojo óxido con bandas horizontales', ar: 'أحمر صدئي بخطوط أفقية' } },
  { id: 'sahara-noir', name: 'Sahara Noir', kind: 'marble', featured: true, tone: { en: 'black with gold and white veins', es: 'negro con vetas doradas y blancas', ar: 'أسود بعروق ذهبية وبيضاء' } },
  { id: 'taj-mahal', name: 'Taj Mahal', kind: 'quartzite', featured: true, tone: { en: 'soft ivory with gentle golden movement', es: 'marfil suave con movimiento dorado', ar: 'عاجي ناعم بحركة ذهبية هادئة' } },
  { id: 'verde-alpi', name: 'Verde Alpi', kind: 'marble', tone: { en: 'deep green with white veins', es: 'verde profundo con vetas blancas', ar: 'أخضر عميق بعروق بيضاء' } },
];

export const MATERIALS: Material[] = list.map((x) => ({ ...x, image: m(x.id) }));
export const FEATURED = MATERIALS.filter((x) => x.featured);
