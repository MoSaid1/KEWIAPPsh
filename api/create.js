import { route, gql, assertNoUserErrors, METAOBJECT_TYPE } from './_shopify.js';

let publishable = null; // cached: does the metaobject definition have the "publishable" capability?

async function isPublishable() {
  if (publishable !== null) return publishable;
  const data = await gql(
    `query ($type: String!) {
      metaobjectDefinitionByType(type: $type) { id capabilities { publishable { enabled } } }
    }`,
    { type: METAOBJECT_TYPE }
  );
  if (!data.metaobjectDefinitionByType) {
    throw new Error(`مفيش metaobject definition بالنوع "${METAOBJECT_TYPE}" في المتجر`);
  }
  publishable = !!data.metaobjectDefinitionByType.capabilities?.publishable?.enabled;
  return publishable;
}

// POST /api/create { resourceUrl, productId, alt }
// 1) registers the uploaded file in Shopify Files, 2) creates a metaobject entry linking it to the product.
export default route('POST', async (req, res) => {
  const { resourceUrl, productId, alt } = req.body || {};
  if (!resourceUrl || !String(productId || '').startsWith('gid://shopify/Product/')) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  const fileData = await gql(
    `mutation ($files: [FileCreateInput!]!) {
      fileCreate(files: $files) { files { id } userErrors { field message } }
    }`,
    { files: [{ originalSource: resourceUrl, contentType: 'IMAGE', alt: alt || '' }] }
  );
  assertNoUserErrors(fileData.fileCreate, 'fileCreate');
  const fileId = fileData.fileCreate.files[0].id;

  const metaobject = {
    type: METAOBJECT_TYPE,
    fields: [
      { key: 'review_image', value: fileId },
      { key: 'product', value: productId },
    ],
  };
  if (await isPublishable()) metaobject.capabilities = { publishable: { status: 'ACTIVE' } };

  const moData = await gql(
    `mutation ($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) { metaobject { id handle } userErrors { field message } }
    }`,
    { metaobject }
  );
  assertNoUserErrors(moData.metaobjectCreate, 'metaobjectCreate');

  res.json({ ok: true, fileId, metaobject: moData.metaobjectCreate.metaobject });
});
