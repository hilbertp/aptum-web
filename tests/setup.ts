// Ensure Web Crypto API is available in Node tests
import { webcrypto } from 'node:crypto';

const g: any = globalThis as any;
if (!g.crypto || !('subtle' in g.crypto)) {
  g.crypto = webcrypto as any;
}
