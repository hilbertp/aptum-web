// Simple AES-GCM wrapper for browser (Web Crypto)

export async function genKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function importRawKey(raw: ArrayBuffer) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

export async function exportRawKey(key: CryptoKey) {
  return crypto.subtle.exportKey('raw', key);
}

export async function encrypt(key: CryptoKey, data: ArrayBuffer): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as ArrayBuffer);
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.byteLength);
  return out;
}

export async function decrypt(key: CryptoKey, payload: Uint8Array): Promise<Uint8Array> {
  const iv = payload.slice(0, 12);
  const cipher = payload.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher as unknown as ArrayBuffer);
  return new Uint8Array(plain);
}
