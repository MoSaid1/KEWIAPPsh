import { route, gql, METAOBJECT_TYPE } from './_shopify.js';

// GET /api/stats → numbers for the dashboard overview
export default route('GET', async (req, res) => {
  const data = await gql(
    `query ($type: String!) {
      productsCount { count }
      metaobjects(type: $type, first: 250) {
        nodes { product: field(key: "product") { reference { ... on Product { id title } } } }
      }
    }`,
    { type: METAOBJECT_TYPE }
  );

  const entries = data.metaobjects.nodes;
  const perProduct = new Map();
  let withoutProduct = 0;
  for (const e of entries) {
    const p = e.product?.reference;
    if (!p) { withoutProduct++; continue; }
    const cur = perProduct.get(p.id) || { title: p.title, count: 0 };
    cur.count++;
    perProduct.set(p.id, cur);
  }

  res.json({
    totalPhotos: entries.length,
    productsCount: data.productsCount?.count ?? null,
    productsWithPhotos: perProduct.size,
    withoutProduct,
    topProducts: [...perProduct.values()].sort((a, b) => b.count - a.count).slice(0, 5),
  });
});
