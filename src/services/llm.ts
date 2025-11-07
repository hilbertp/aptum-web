import { getAIKey, getAIModel } from '@/services/byok';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function detectProvider(key: string): 'openai' | 'unknown' {
  // Simple heuristic: OpenAI keys commonly start with "sk-"
  if (key.startsWith('sk-')) return 'openai';
  return 'unknown';
}

async function callOpenAIJson(messages: ChatMessage[], temperature = 0.2): Promise<string> {
  const key = getAIKey();
  if (!key) throw new Error('Missing BYOK API key');
  const model = getAIModel();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages
    })
  });
  if (!res.ok) {
    let detail: any = undefined;
    try { detail = await res.json(); } catch { /* ignore */ }
    throw new Error(`OpenAI error ${res.status}: ${detail?.error?.message || res.statusText}`);
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error('No content from OpenAI');
  return content.trim();
}

export async function chatJson(prompt: string, temperature = 0.2): Promise<any> {
  const key = getAIKey();
  if (!key) throw new Error('Missing BYOK API key');
  const provider = detectProvider(key);
  const sys: ChatMessage = { role: 'system', content: 'You are an assistant that ONLY replies with strict JSON. Do not include code fences.' };
  const user: ChatMessage = { role: 'user', content: prompt };
  let text: string;
  switch (provider) {
    case 'openai':
      text = await callOpenAIJson([sys, user], temperature);
      break;
    default:
      throw new Error('Unsupported BYOK provider. Provide an OpenAI-compatible key.');
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Model did not return valid JSON');
  }
}
