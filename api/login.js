import { route } from './_shopify.js';

export default route('POST', async (req, res) => {
  res.json({ ok: true });
});
