// Ensure Web Crypto API is available in Node tests
import { webcrypto } from 'node:crypto';

// @ts-ignore
if (!globalThis.crypto || !('subtle' in globalThis.crypto)) {
  // @ts-ignore
  globalThis.crypto = webcrypto as unknown as Crypto;
}
