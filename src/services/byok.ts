const KEY = 'aptum_ai_byok';
const MODEL_KEY = 'aptum_ai_model';

export function getAIKey(): string | undefined {
  try {
    const v = localStorage.getItem(KEY);
    return v || undefined;
  } catch {
    return undefined;
  }
}

export function setAIKey(k: string) {
  localStorage.setItem(KEY, k);
}

export function clearAIKey() {
  localStorage.removeItem(KEY);
}

export function getAIModel(): string {
  try {
    return localStorage.getItem(MODEL_KEY) || 'gpt-4o-mini';
  } catch {
    return 'gpt-4o-mini';
  }
}

export function setAIModel(model: string) {
  localStorage.setItem(MODEL_KEY, model);
}
