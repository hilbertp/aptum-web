const KEY = 'aptum_ai_byok';

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
