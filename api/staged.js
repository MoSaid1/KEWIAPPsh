import { route, gql, assertNoUserErrors } from './_shopify.js';

// POST /api/staged { filename, mimeType, fileSize }
// Returns a signed upload target so the browser uploads the file straight to
// Shopify's storage (bypasses Vercel's request body size limit).
export default route('POST', async (req, res) => {
  const { filename, mimeType, fileSize } = req.body || {};
  if (!filename || !mimeType || !String(mimeType).startsWith('image/')) {
    return res.status(400).json({ error: 'لازم يكون الملف صورة' });
  }
  const data = await gql(
    `mutation ($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      input: [{ resource: 'IMAGE', filename, mimeType, fileSize: String(fileSize), httpMethod: 'POST' }],
    }
  );
  assertNoUserErrors(data.stagedUploadsCreate, 'stagedUploadsCreate');
  res.json(data.stagedUploadsCreate.stagedTargets[0]);
});
