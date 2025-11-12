import { byok } from './byok';

// Fixed embedding model to match the prebuilt KB index
const EMBED_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-5';

export async function embed(inputs: string[]): Promise<number[][]> {
  const { apiKey } = byok.get();
  const model = EMBED_MODEL;
  if (!apiKey) throw new Error('BYOK API key not set');
  const url = 'https://api.openai.com/v1/embeddings';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, input: inputs })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embeddings HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  const out = (data?.data || []).map((d: any) => d.embedding as number[]);
  if (!Array.isArray(out) || out.length !== inputs.length) {
    throw new Error('Embeddings response malformed');
  }
  return out;
}

export async function chatJSON(system: string, user: string): Promise<any> {
  const { apiKey } = byok.get();
  if (!apiKey) throw new Error('BYOK API key not set');
  const url = 'https://api.openai.com/v1/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch {
    // try to extract JSON block
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Model did not return JSON');
  }
}
