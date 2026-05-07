export default async function handler(req, res) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    const data = await resp.json();
    res.status(200).json({ httpStatus: resp.status, models: data });
  } catch (err) {
    res.status(200).json({ error: err.message });
  }
}
