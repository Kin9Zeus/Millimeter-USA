// JSON-LD builders shared by pages (merged into the page @graph by Base.astro).
export const faqSchema = (items: { q: string; a: string }[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })),
});

export const itemList = (name: string, items: { name: string; url?: string; image?: string; description?: string }[]) => ({
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: { '@type': 'Thing', name: it.name, ...(it.url && { url: it.url }), ...(it.image && { image: it.image }), ...(it.description && { description: it.description }) },
  })),
});
