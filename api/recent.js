import { route, gql, METAOBJECT_TYPE } from './_shopify.js';

// GET /api/recent?limit=N → latest review-image entries with their image + product
export default route('GET', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  const data = await gql(
    `query ($type: String!, $limit: Int!) {
      metaobjects(type: $type, first: $limit, reverse: true, sortKey: "updated_at") {
        nodes {
          id
          updatedAt
          image: field(key: "review_image") {
            reference { ... on MediaImage { image { url(transform: { maxWidth: 800 }) full: url width height } } }
          }
          product: field(key: "product") {
            reference { ... on Product { id title featuredMedia { preview { image { url(transform: { maxWidth: 80 }) } } } } }
          }
        }
      }
    }`,
    { type: METAOBJECT_TYPE, limit }
  );
  res.json(
    data.metaobjects.nodes.map((n) => ({
      id: n.id,
      updatedAt: n.updatedAt,
      image: n.image?.reference?.image?.url || null,
      full: n.image?.reference?.image?.full || null,
      width: n.image?.reference?.image?.width || null,
      height: n.image?.reference?.image?.height || null,
      product: n.product?.reference?.title || null,
      productImage: n.product?.reference?.featuredMedia?.preview?.image?.url || null,
    }))
  );
});
