import { describe, it, expect } from 'vitest';
import { genKey, encrypt, decrypt } from '@/services/crypto';

describe('crypto AES-GCM', () => {
  it('encrypts and decrypts roundtrip', async () => {
    const key = await genKey();
    const data = new TextEncoder().encode('hello aptum');
    const enc = await encrypt(key, data.buffer);
    const dec = await decrypt(key, enc);
    expect(new TextDecoder().decode(dec)).toBe('hello aptum');
  });
});
