// Ensure Web Crypto API is available in Node tests
import { webcrypto } from 'node:crypto';
import 'fake-indexeddb/auto';

const g: any = globalThis as any;
if (!g.crypto || !('subtle' in g.crypto)) {
  g.crypto = webcrypto as any;
}
