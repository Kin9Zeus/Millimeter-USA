import type { APIRoute } from 'astro';
import en from '../i18n/en';
import { ROUTES, CONTACT } from '../i18n/routes';
import { MATERIALS } from '../data/materials';

// llms.txt — a concise, factual brief for AI assistants and answer engines (GEO).
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(site!).origin + p; // ROUTES already include the base path
  const body = `# MILLIMETER by Casanova

> Real natural stone (marble, quartzite, travertine and granite) processed to 1–5 mm thick: 80–90% lighter than traditional 3/4 in (2 cm) stone and genuinely curvable at 1 mm. MILLIMETER Global LLC is headquartered in Houston, Texas, with commercial presence in the United States, Spain and the United Arab Emirates, and is led by founder and CEO Jesús Casanova.

## Key facts
- Thickness: 1 mm (curves, columns, arches, cabinet fronts) and 5 mm (feature walls, showers, doors, ceilings, countertops, integrated sinks).
- Weight: 1 mm < 1 lb/ft² (< 5 kg/m²); 5 mm 3–4 lb/ft² (15–20 kg/m²); traditional 2 cm stone 13–15 lb/ft² (63–73 kg/m²). 73–93% less load.
- Curvature: continuous curves without joints at 1 mm; minimum radius depends on the material and is confirmed per project.
- Health: crystalline silica depends on the stone type (OSHA–NIOSH Hazard Alert, 2026): marble and limestone/travertine < 5%, granite 10–50%, quartzite ≥ 95%, engineered stone < 0.2–95%. MILLIMETER does not claim natural stone is silica-free; at 1–5 mm each cut removes far less material than through a 2–3 cm slab.
- Formats: custom per project; sheets up to about 10 ft (3 m).
- Applications: ${en.applications.items.map((i) => i.title.toLowerCase()).join(', ')}.
- Materials: ${MATERIALS.map((m) => m.name).join(', ')}.
- Built projects: Wittman Residence (Austin, TX — curved floating vanity, Cream Travertine, 1 mm + 5 mm); Barret Project (San Diego, CA — continuous curved arch cladding, Calacatta Viola, 1 mm + 2 cm); Altuve Residence (Houston, TX — bar cabinet, Dark Emperador, 5 mm).
- Company: ${CONTACT.company}, headquartered in Houston, Texas; presence in the United States, Spain and the United Arab Emirates. Fabrication in Houston and Spain. More than 90 years and three generations working with natural stone, from a family tradition in Spain.
- Contact: ${CONTACT.email} · WhatsApp ${CONTACT.whatsappDisplay} · Instagram ${CONTACT.instagramHandle}. Reply within one business day.

## Pages
- [Home](${u(ROUTES.home.en)}): overview of the MILLIMETER system
- [Technology](${u(ROUTES.technology.en)}): specifications, weight, curvature, health and carbon footprint
- [Applications](${u(ROUTES.applications.en)}): the eight applications in detail
- [Materials](${u(ROUTES.materials.en)}): marble, quartzite and travertine catalog
- [Projects](${u(ROUTES.projects.en)}): built work, quarries, fabrication and commercial presence worldwide
- [Casanova](${u(ROUTES.casanova.en)}): company legacy and Jesús Casanova
- [Contact](${u(ROUTES.contact.en)}): send drawings or a sketch for a technical review
- [Spanish version](${u(ROUTES.home.es)})
- [Arabic version](${u(ROUTES.home.ar)})

## Related sites
- Corporate: ${CONTACT.corporate}
- South America representation: ${CONTACT.southAmerica}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
