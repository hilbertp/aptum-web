KB Retrieval Index

Overview
- Build-time script compiles a compact knowledge index from allowed sources and writes it to public/kb_index.
- The client loads the index, embeds the user query with BYOK, and performs cosine+MMR ranking.

Included sources
- public/papers_md/*.md            -> free-licensed paper text (kind: paper)
- docs/papers_notes/*.md           -> derived notes for restricted/unknown licenses (kind: note)
- docs/videos/*/notes.md           -> derived video notes (kind: video_note)
- docs/videos/*/claims.json        -> atomic claims from videos (kind: video_claim)

Build
- GitHub Action: .github/workflows/build-kb-index.yml
  - Triggers: workflow_dispatch and push to build-kb-index.trigger or content paths
  - Requires repository secret OPENAI_API_KEY
  - Runs: python scripts/build_kb_index.py

Output schema
- public/kb_index/manifest.json
  {
    "version": "1.0",
    "created_at": <epoch>,
    "embedding_model": "text-embedding-3-small",
    "embedding_dim": 1536,
    "total_chunks": N,
    "files": ["chunks-000.json"]
  }
- public/kb_index/chunks-000.json: Array of chunk objects
  - id: string (e.g., "paper:PMID:35445953:c0")
  - text: string
  - embedding: number[] (Float32 precision not required at this scale)
  - kind: "paper" | "note" | "video_note" | "video_claim"
  - license: string (e.g., "cc by", "derived")
  - pmid?: string
  - videoId?: string
  - title?: string
  - sourceUrl?: string

Client usage
- src/services/byok.ts: minimal localStorage-backed BYOK storage
- src/services/llm.ts: embed(inputs) uses a fixed encoder that matches the prebuilt index. This choice is made at build time and is not exposed to end users.
- src/services/retrieve.ts:
  - loadIndex(baseUrl)
  - search(query, { topK, filters, baseUrl }) -> returns ranked chunks with scores

Strategy integration
- src/services/strategy.ts attaches top KB sources to the returned Plan.sources (optional) for transparency.
- Schema extended in src/schemas/product.ts to include an optional "sources" array.

Manual triggers
- Touch and push build-kb-index.trigger to force rebuild:
  echo $(date +%s) > build-kb-index.trigger
  git add build-kb-index.trigger && git commit -m "chore: trigger kb index build" && git push

- Only content under permissible licenses is included. Paper full text chunks are limited to CC BY/CC0/CC BY-SA. Notes and video artifacts are original, derived content.
- The embedding model is selected at KB build time and stored in the manifest. The client uses the same encoder under the hood. There is no user-facing control for this.
