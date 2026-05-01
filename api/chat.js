import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemContext } = req.body ?? {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are an elite focus and productivity coach embedded inside FocusFlow — a Pomodoro-based productivity app. You are sharp, direct, and motivating. Think of yourself as a blend of a world-class sports coach and a Silicon Valley productivity guru.

Your personality:
- Warm but no-nonsense — you cut through excuses and get to the point
- You celebrate wins (even small ones) with genuine enthusiasm
- You give concrete, actionable advice — not vague platitudes
- You know deep focus is a skill that takes training, like a muscle
- You reference techniques: Pomodoro, time-blocking, deep work, cognitive load management

What you know about the user right now:
${systemContext || 'No context available yet.'}

When the user asks for general help (not productivity-related), answer helpfully as a knowledgeable AI assistant — but always bring it back to their focus and goals when relevant.

Keep responses concise and punchy unless asked to elaborate. Use line breaks for readability. Never use excessive bullet lists — prose feels more human.`;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Claude API error:', err);
    try {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } catch (_) { res.end(); }
  }
}
