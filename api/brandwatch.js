// api/brandwatch.js
// Vercel serverless function — runs server-side, credentials never exposed to browser

const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const TEAM_PASSWORD = process.env.TEAM_PASSWORD; // Shared password your team uses to log in

let cachedToken = null;
let tokenExpiry = 0;

// ── Get or refresh Brandwatch OAuth token ──
async function getBrandwatchToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const url = `https://api.brandwatch.com/oauth/token?username=${encodeURIComponent(BW_USERNAME)}&grant_type=api-password&client_id=brandwatch-api-client`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `password=${encodeURIComponent(BW_PASSWORD)}`
  });
  if (!resp.ok) throw new Error('Brandwatch auth failed');
  const data = await resp.json();
  cachedToken = data.access_token;
  // Cache for 23 hours (token lasts ~1 year but we refresh daily to be safe)
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

// ── Main handler ──
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Team-Password');
    res.status(200).end();
    return;
  }

  // ── Password check ──
  const submittedPassword = req.headers['x-team-password'];
  if (!submittedPassword || submittedPassword !== TEAM_PASSWORD) {
    res.status(403).json({ error: 'Incorrect password' });
    return;
  }

  // ── Route request to Brandwatch ──
  try {
    const bwToken = await getBrandwatchToken();
    const { path, ...otherParams } = req.query;
    const pathStr = Array.isArray(path) ? path.join('/') : path || '';
    const queryString = new URLSearchParams(otherParams).toString();
    const targetUrl = `https://api.brandwatch.com/${pathStr}${queryString ? '?' + queryString : ''}`;

    const bwResp = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${bwToken}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await bwResp.json();
    res.status(bwResp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
