"""
Build a compact local retrieval index from allowed KB sources.

Sources included:
- public/papers_md/*.md            -> kind: "paper" (free CC licenses only; already enforced upstream)
- docs/papers_notes/*.md           -> kind: "note" (derived writing)
- docs/videos/*/notes.md           -> kind: "video_note" (derived)
- docs/videos/*/claims.json        -> kind: "video_claim" (derived)

Outputs (written under public/kb_index/):
- manifest.json
  {
    "version": "1.0",
    "created_at": <epoch>,
    "embedding_model": "text-embedding-3-small",
    "embedding_dim": 1536,
    "total_chunks": N,
    "files": ["chunks-000.json"]
  }
- chunks-000.json
  [
    { "id": "paper:PMID:35445953:c0", "text": "...", "embedding": [...],
      "kind": "paper", "license": "cc by", "pmid": "35445953",
      "title": "...", "sourceUrl": "/public/papers/35445953.pdf" },
    { "id": "note:PMID:40133968", "text": "...", "embedding": [...],
      "kind": "note", "license": "derived", "pmid": "40133968",
      "title": "...", "sourceUrl": "/docs/papers_notes/40133968.md" },
    { "id": "video_note:yt_DzjWEn2BS_k", ... },
    { "id": "video_claim:claim_low_vol_cut", ... }
  ]

Environment:
- Requires OPENAI_API_KEY in environment for embeddings.

Usage:
  python scripts/build_kb_index.py
"""

from __future__ import annotations
import os
import re
import json
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import urllib.request

ROOT = Path('.')
PUB = ROOT / 'public'
DOCS = ROOT / 'docs'


def read_json(fp: Path):
    return json.loads(fp.read_text(encoding='utf-8'))


def read_text(fp: Path) -> str:
    return fp.read_text(encoding='utf-8', errors='ignore')


def parse_front_matter(md: str) -> Tuple[Dict[str, str], str]:
    """Very small YAML-like front matter parser; returns (meta, body)."""
    if md.startswith('---'):
        end = md.find('\n---', 3)
        if end != -1:
            header = md[3:end].strip()
            body = md[end + 4 :].lstrip('\n')
            meta: Dict[str, str] = {}
            for line in header.splitlines():
                if ':' in line:
                    k, v = line.split(':', 1)
                    meta[k.strip()] = v.strip().strip('"')
            return meta, body
    return {}, md


def chunk_text(text: str, target_chars: int = 1200, overlap: int = 200) -> List[str]:
    """Greedy paragraph-based chunking with approximate char limits."""
    # Normalize line breaks
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    paras = re.split(r"\n\s*\n", text)
    chunks: List[str] = []
    buf: List[str] = []
    curr = 0
    for p in paras:
        p = p.strip()
        if not p:
            continue
        if curr + len(p) + 2 <= target_chars:
            buf.append(p)
            curr += len(p) + 2
        else:
            if buf:
                chunks.append('\n\n'.join(buf))
            # start new buffer; try to preserve some overlap from previous
            if overlap > 0 and chunks:
                tail = chunks[-1][-overlap:]
                buf = [tail, p]
                curr = len(tail) + len(p) + 2
            else:
                buf = [p]
                curr = len(p)
    if buf:
        chunks.append('\n\n'.join(buf))
    # post-process: trim overly long chunk tails
    out = [c.strip()[: target_chars + 200] for c in chunks if c.strip()]
    return out


def openai_embed_batch(texts: List[str], model: str = 'text-embedding-3-small') -> List[List[float]]:
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not set for embedding build')
    body = json.dumps({"model": model, "input": texts}).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/embeddings',
        data=body,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode())
    embs = [item['embedding'] for item in data.get('data', [])]
    if len(embs) != len(texts):
        raise RuntimeError('Embedding count mismatch')
    return embs  # type: ignore


def collect_sources() -> List[Dict]:
    # Load paper metadata index for titles/licenses/links
    paper_index = (PUB / 'papers' / 'index.json')
    idx = read_json(paper_index) if paper_index.exists() else {"papers": []}
    pmid_meta: Dict[str, Dict] = {m.get('pmid'): m for m in idx.get('papers', [])}

    entries: List[Dict] = []

    # 1) Free paper markdown
    papers_md_dir = PUB / 'papers_md'
    if papers_md_dir.exists():
        for md_fp in sorted(papers_md_dir.glob('*.md')):
            pmid = md_fp.stem
            md = read_text(md_fp)
            fm, body = parse_front_matter(md)
            title = fm.get('title') or (pmid_meta.get(pmid, {}).get('title') or '')
            license_norm = (fm.get('license') or pmid_meta.get(pmid, {}).get('license') or '').lower()
            # Prefer local PDF if exists
            local_pdf = PUB / 'papers' / f'{pmid}.pdf'
            if local_pdf.exists():
                src = f"/public/papers/{pmid}.pdf"
            else:
                src = pmid_meta.get(pmid, {}).get('pdf_url') or pmid_meta.get(pmid, {}).get('source') or ''
            chunks = chunk_text(body)
            for i, ch in enumerate(chunks):
                entries.append({
                    'id': f'paper:PMID:{pmid}:c{i}',
                    'text': ch,
                    'kind': 'paper',
                    'license': license_norm or 'cc by',
                    'pmid': pmid,
                    'title': title,
                    'sourceUrl': src
                })

    # 2) Notes for restricted/unknown license papers (derived)
    notes_dir = DOCS / 'papers_notes'
    if notes_dir.exists():
        for note_fp in sorted(notes_dir.glob('*.md')):
            pmid = note_fp.stem
            md = read_text(note_fp)
            fm, body = parse_front_matter(md)
            title = fm.get('title') or (pmid_meta.get(pmid, {}).get('title') or '')
            chunks = chunk_text(body, target_chars=1000, overlap=120)
            for i, ch in enumerate(chunks):
                entries.append({
                    'id': f'note:PMID:{pmid}:c{i}',
                    'text': ch,
                    'kind': 'note',
                    'license': 'derived',
                    'pmid': pmid,
                    'title': title,
                    'sourceUrl': f'/docs/papers_notes/{pmid}.md'
                })

    # 3) Video notes and claims (derived)
    videos_dir = DOCS / 'videos'
    if videos_dir.exists():
        for sub in sorted(videos_dir.glob('*')):
            if not sub.is_dir():
                continue
            meta_fp = sub / 'meta.json'
            meta = read_json(meta_fp) if meta_fp.exists() else {}
            vid = meta.get('id') or sub.name
            vtitle = meta.get('title') or sub.name.replace('_', ' ')
            vurl = meta.get('url') or ''

            # notes.md
            nfp = sub / 'notes.md'
            if nfp.exists():
                body = read_text(nfp)
                chunks = chunk_text(body, target_chars=1000, overlap=120)
                for i, ch in enumerate(chunks):
                    entries.append({
                        'id': f'video_note:{vid}:c{i}',
                        'text': ch,
                        'kind': 'video_note',
                        'license': 'derived',
                        'videoId': vid,
                        'title': vtitle,
                        'sourceUrl': vurl or f'/docs/videos/{sub.name}/notes.md'
                    })

            # claims.json
            cfp = sub / 'claims.json'
            if cfp.exists():
                try:
                    claims = read_json(cfp)
                    for claim in claims:
                        cid = claim.get('id') or f'claim:{vid}:{len(entries)}'
                        text = claim.get('text') or ''
                        if not text.strip():
                            continue
                        entries.append({
                            'id': f'video_claim:{cid}',
                            'text': text,
                            'kind': 'video_claim',
                            'license': 'derived',
                            'videoId': vid,
                            'title': vtitle,
                            'sourceUrl': vurl or f'/docs/videos/{sub.name}/claims.json'
                        })
                except Exception:
                    pass

    return entries


def main():
    out_dir = PUB / 'kb_index'
    out_dir.mkdir(parents=True, exist_ok=True)

    entries = collect_sources()
    texts = [e['text'] for e in entries]
    embeddings: List[List[float]] = []
    # embed in batches of up to 96 to stay safe
    BATCH = 96
    for i in range(0, len(texts), BATCH):
        batch = texts[i : i + BATCH]
        if not batch:
            continue
        embs = openai_embed_batch(batch)
        embeddings.extend(embs)
        time.sleep(0.2)

    # Attach embeddings
    if len(embeddings) != len(entries):
        raise RuntimeError('Embeddings length mismatch with entries')
    for e, vec in zip(entries, embeddings):
        e['embedding'] = vec

    # Write output
    chunks_fp = out_dir / 'chunks-000.json'
    manifest_fp = out_dir / 'manifest.json'

    with chunks_fp.open('w', encoding='utf-8') as f:
        json.dump(entries, f)

    manifest = {
        'version': '1.0',
        'created_at': time.time(),
        'embedding_model': 'text-embedding-3-small',
        'embedding_dim': 1536,
        'total_chunks': len(entries),
        'files': ['chunks-000.json'],
    }
    with manifest_fp.open('w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f"KB index built: {len(entries)} chunks -> {manifest_fp}")


if __name__ == '__main__':
    main()
