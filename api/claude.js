// api/claude.js
// Proxies Claude API calls server-side so the Anthropic key is never in the browser

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TEAM_PASSWORD = process.env.TEAM_PASSWORD;

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Team-Password');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // ── Password check ──
  const submittedPassword = req.headers['x-team-password'];
  if (!submittedPassword || submittedPassword !== TEAM_PASSWORD) {
    res.status(403).json({ error: 'Incorrect password' });
    return;
  }

  // ── Proxy to Anthropic ──
  try {
    if (!ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' });
      return;
    }
    const { system, user } = req.body;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      // Surface the full Anthropic error so we can debug
      res.status(resp.status).json({ error: `Anthropic error: ${JSON.stringify(data)}` });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
