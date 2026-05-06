// api/test.js - temporary debug endpoint, delete after fixing
export default async function handler(req, res) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    res.status(200).json({ status: 'ERROR', message: 'ANTHROPIC_API_KEY is not set in Vercel environment variables' });
    return;
  }

  res.status(200).json({ 
    status: 'OK', 
    keyPrefix: ANTHROPIC_API_KEY.substring(0, 12) + '...',
    keyLength: ANTHROPIC_API_KEY.length
  });
}
