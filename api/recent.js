import { route, gql, METAOBJECT_TYPE } from './_shopify.js';

// GET /api/recent → latest review-image entries with their image + product
export default route('GET', async (req, res) => {
  const data = await gql(
    `query ($type: String!) {
      metaobjects(type: $type, first: 30, reverse: true, sortKey: "updated_at") {
        nodes {
          id
          updatedAt
          image: field(key: "review_image") {
            reference { ... on MediaImage { image { url(transform: { maxWidth: 300 }) } } }
          }
          product: field(key: "product") {
            reference { ... on Product { id title } }
          }
        }
      }
    }`,
    { type: METAOBJECT_TYPE }
  );
  res.json(
    data.metaobjects.nodes.map((n) => ({
      id: n.id,
      updatedAt: n.updatedAt,
      image: n.image?.reference?.image?.url || null,
      product: n.product?.reference?.title || '—',
    }))
  );
});
