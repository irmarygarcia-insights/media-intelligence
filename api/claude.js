// api/claude.js
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TEAM_PASSWORD = process.env.TEAM_PASSWORD;

export default async function handler(req, res) {
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

  const submittedPassword = req.headers['x-team-password'];
  if (!submittedPassword || submittedPassword !== TEAM_PASSWORD) {
    res.status(403).json({ error: 'Incorrect password' });
    return;
  }

  if (!ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' });
    return;
  }

  try {
    const { system, user } = req.body;

    // Try claude-3-5-haiku — widely available on all API key tiers
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Return full Anthropic error so we can see exactly what's wrong
      res.status(resp.status).json({ 
        error: `Anthropic error ${resp.status}: ${JSON.stringify(data)}` 
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
