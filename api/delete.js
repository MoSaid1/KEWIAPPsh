import { route, gql, assertNoUserErrors } from './_shopify.js';

// POST /api/delete { id } → removes the metaobject entry (the image stays in Shopify Files)
export default route('POST', async (req, res) => {
  const { id } = req.body || {};
  if (!String(id || '').startsWith('gid://shopify/Metaobject/')) {
    return res.status(400).json({ error: 'id غلط' });
  }
  const data = await gql(
    `mutation ($id: ID!) { metaobjectDelete(id: $id) { deletedId userErrors { field message } } }`,
    { id }
  );
  assertNoUserErrors(data.metaobjectDelete, 'metaobjectDelete');
  res.json({ ok: true });
});
