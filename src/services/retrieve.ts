import { embed } from './llm';

export type KBChunk = {
  id: string;
  text: string;
  embedding: number[];
  kind: 'paper' | 'note' | 'video_note' | 'video_claim';
  license: string;
  pmid?: string;
  videoId?: string;
  title?: string;
  sourceUrl?: string;
};

export type KBManifest = {
  version: string;
  created_at: number;
  embedding_model: string;
  embedding_dim: number;
  total_chunks: number;
  files: string[];
};

export type RetrieveFilters = {
  kinds?: KBChunk['kind'][];
  licenses?: string[];
};

type LoadedIndex = { manifest: KBManifest; chunks: KBChunk[] };

let cachedIndex: LoadedIndex | null = null;

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export async function loadIndex(baseUrl = '/kb_index'): Promise<LoadedIndex> {
  if (cachedIndex) return cachedIndex;
  const manifest = await fetchJSON<KBManifest>(`${baseUrl}/manifest.json`);
  // Warn in dev if manifest embedding model doesn't match client encoder choice
  try {
    if (manifest.embedding_model && manifest.embedding_model !== 'text-embedding-3-small') {
      // Not shown to users; helps developers keep index in sync
      // eslint-disable-next-line no-console
      console.warn('KB index embedding_model differs from client encoder: ', manifest.embedding_model, '!= text-embedding-3-small');
    }
  } catch (e) {
    // ignore
  }
  const chunksAll: KBChunk[] = [];
  for (const f of manifest.files) {
    const part = await fetchJSON<KBChunk[]>(`${baseUrl}/${f}`);
    chunksAll.push(...part);
  }
  cachedIndex = { manifest, chunks: chunksAll };
  return cachedIndex;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length && i < b.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}

function l2(a: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (a[i] ?? 0);
  return Math.sqrt(s);
}

function cosine(a: number[], b: number[]): number {
  const na = l2(a);
  const nb = l2(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

function mmrSelect(query: number[], cands: KBChunk[], k: number, lambda = 0.5): { idx: number; score: number }[] {
  // Greedy Maximal Marginal Relevance selection
  const picked: number[] = [];
  const scores: number[] = cands.map(c => cosine(query, c.embedding));
  const out: { idx: number; score: number }[] = [];
  while (picked.length < Math.min(k, cands.length)) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < cands.length; i++) {
      if (picked.includes(i)) continue;
      const simToQuery = scores[i] ?? 0;
      let maxSimToPicked = 0;
      for (const pj of picked) {
        const sim = cosine(cands[i]!.embedding, cands[pj]!.embedding);
        if (sim > maxSimToPicked) maxSimToPicked = sim;
      }
      const mmr = lambda * simToQuery - (1 - lambda) * maxSimToPicked;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    picked.push(bestIdx);
    out.push({ idx: bestIdx, score: scores[bestIdx] ?? 0 });
  }
  return out;
}

export async function search(query: string, opts?: { topK?: number; filters?: RetrieveFilters; baseUrl?: string }) {
  const { topK = 6, filters, baseUrl } = opts || {};
  const { chunks } = await loadIndex(baseUrl);
  // Filter candidates
  let cands = chunks;
  if (filters?.kinds && filters.kinds.length) {
    const s = new Set(filters.kinds);
    cands = cands.filter(c => s.has(c.kind));
  }
  if (filters?.licenses && filters.licenses.length) {
    const s = new Set(filters.licenses.map(x => x.toLowerCase()));
    cands = cands.filter(c => s.has((c.license || '').toLowerCase()));
  }
  if (cands.length === 0) return [] as Array<KBChunk & { score: number }>;

  const emb = await embed([query]);
  const qvec = emb[0] || [];
  const picked = mmrSelect(qvec, cands, topK, 0.5);
  const results = picked.map(({ idx, score }) => ({ ...cands[idx], score }));
  // Sort desc by score
  results.sort((a, b) => b.score - a.score);
  return results;
}
