// Shared helpers: password check + Shopify Admin GraphQL client.
// Files starting with "_" are not exposed as routes by Vercel.
import { timingSafeEqual } from 'node:crypto';

const STORE = (process.env.SHOPIFY_STORE || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';
export const METAOBJECT_TYPE = process.env.METAOBJECT_TYPE || 'product_review_images';

let cachedToken = null; // { value, expiresAt }

// Two auth options:
//  1) SHOPIFY_ADMIN_TOKEN (shpat_...) from a legacy custom app, or
//  2) SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET from a Dev Dashboard app (client credentials grant).
async function getAccessToken() {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID || '',
      client_secret: process.env.SHOPIFY_CLIENT_SECRET || '',
    }),
  });
  if (!res.ok) throw new Error(`Shopify token request failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 23 * 3600 * 1000),
  };
  return cachedToken.value;
}

export async function gql(query, variables = {}) {
  if (!STORE) throw new Error('SHOPIFY_STORE is not configured');
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': await getAccessToken(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    const msg = json.errors ? JSON.stringify(json.errors) : `HTTP ${res.status}`;
    throw new Error(`Shopify API error: ${msg}`);
  }
  return json.data;
}

// Throws if a mutation payload returned userErrors.
export function assertNoUserErrors(payload, label) {
  const errs = payload?.userErrors || [];
  if (errs.length) throw new Error(`${label}: ${errs.map((e) => e.message).join(' | ')}`);
}

function checkPassword(req) {
  const expected = process.env.UPLOAD_PASSWORD || '';
  const given = String(req.headers['x-password'] || '');
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Wraps a handler with method + password checks and JSON error handling.
export function route(method, handler) {
  return async (req, res) => {
    if (req.method !== method) return res.status(405).json({ error: 'Method not allowed' });
    if (!checkPassword(req)) return res.status(401).json({ error: 'كلمة السر غلط' });
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  };
}
