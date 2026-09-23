import { route, gql } from './_shopify.js';

// GET /api/products?q=term  → [{ id, title, handle, image }]
export default route('GET', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const data = await gql(
    `query ($query: String) {
      products(first: 25, query: $query, sortKey: TITLE) {
        nodes { id title handle status featuredMedia { preview { image { url(transform: { maxWidth: 120 }) } } } }
      }
    }`,
    { query: q ? `title:*${q.replace(/["\\]/g, '')}*` : null }
  );
  res.json(
    data.products.nodes.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      status: p.status,
      image: p.featuredMedia?.preview?.image?.url || null,
    }))
  );
});
