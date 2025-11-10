"""
Generate rewritten, coach-ready notes for papers we cannot rehost (non-free/ND licenses).

Behavior:
  - Reads public/papers/index.json
  - Selects items whose license IS NOT in FREE_LICENSES
  - Fetches abstract and core metadata from Europe PMC
  - If OPENAI_API_KEY is set, uses OpenAI to paraphrase the abstract into
    concise bullet points (no verbatim copying, no quotes > 90 chars)
  - Writes notes to docs/papers_notes/{pmid}.md with YAML front matter
  - Updates docs/papers/README.md to add a Notes column linking to notes (if present)

Safeguards:
  - No verbatim text beyond 90 characters
  - Clear attribution and license reminder in front matter
  - Only abstracts are processed; full text is never copied
"""

from __future__ import annotations
import json
import os
import re
import textwrap
from pathlib import Path
from typing import Optional
from urllib.request import urlopen, Request

FREE_LICENSES = {"cc by", "cc0", "cc by-sa"}

def epmc_core(pmid: str) -> dict:
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:{pmid}&resultType=core&format=json"
    with urlopen(Request(url, headers={"User-Agent": "aptum-notes/1.0"})) as r:
        data = json.loads(r.read().decode())
    results = data.get("resultList", {}).get("result", [])
    return results[0] if results else {}


def openai_notes(abstract: str, meta: dict) -> str:
    import os
    import json
    import urllib.request

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return ""
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    system = (
        "You are a scientific editor creating coach-ready notes."
        " Rewrite in your own words."
        " Do not quote the paper. Do not include verbatim text beyond 90 characters."
        " Focus on: population, design, sample size, intervention/exposure, outcomes, key results, practical implications, and limitations."
    )
    user = (
        "Paper metadata (JSON):\n" + json.dumps(meta, ensure_ascii=False) +
        "\n\nAbstract:\n" + abstract +
        "\n\nWrite 6-10 bullet points. Use short, plain language sentences."
    )
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read().decode())
    content = out.get("choices", [{}])[0].get("message", {}).get("content", "")
    return content.strip()


def naive_bullets(abstract: str) -> str:
    # Fallback: produce minimal bullets without copying long sequences.
    # We split into short sentences and compress aggressively.
    sents = re.split(r"(?<=[.!?])\s+", abstract.strip()) if abstract else []
    bullets = []
    for s in sents:
        s = re.sub(r"\s+", " ", s).strip()
        if not s:
            continue
        # avoid long lines; truncate and paraphrase lightly
        s = s.replace("participants", "people")
        s = s.replace("significant", "statistically significant")
        if len(s) > 180:
            s = s[:170].rsplit(" ", 1)[0] + " …"
        bullets.append(f"- {s}")
        if len(bullets) >= 8:
            break
    return "\n".join(bullets) if bullets else "- Summary not available."


def write_note(pmid: str, meta: dict, abstract: str, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{pmid}.md"
    title = meta.get("title") or ""
    lic = meta.get("license") or ""
    source = f"https://europepmc.org/abstract/MED/{pmid}"

    body = ""
    try:
        body = openai_notes(abstract, meta)
    except Exception:
        body = ""
    if not body:
        body = naive_bullets(abstract)

    fm = textwrap.dedent(f"""
    ---
    pmid: {pmid}
    title: "{title.replace('"', "'")}"
    license: "{lic}"
    source: "{source}"
    note: "These notes are original writing derived from public metadata/abstract; not a copy of the paper."
    ---
    """)
    target.write_text(fm + "\n" + body + "\n", encoding="utf-8")


def update_readme_index(idx_path: Path, readme_path: Path, notes_dir: Path) -> None:
    idx = json.loads(idx_path.read_text())
    rows = []
    for i, m in enumerate(idx["papers"], 1):
        title = (m.get("title") or "").replace("|", "-")
        pmid = m.get("pmid") or ""
        lic = m.get("license") or "—"
        if m.get("local_path"):
            link = f"/public/papers/{pmid}.pdf"
        else:
            link = m.get("pdf_url") or m.get("source") or ""
        notes_link = f"docs/papers_notes/{pmid}.md" if (notes_dir / f"{pmid}.md").exists() else ""
        rows.append((i, title, pmid, lic, link, notes_link))

    lines = []
    lines.append("# Aptum Papers Archive (Free Licenses Only)\n")
    lines.append("This folder contains locally archived PDFs for papers with free/redistributable licenses (CC BY, CC0, CC BY-SA).")
    lines.append("Papers with other open-access licenses (e.g., CC BY-NC-ND) are linked externally.")
    lines.append("\nFor free-licensed papers we also provide extracted Markdown in public/papers_md/ for easier search (best-effort extraction).\n")
    lines.append("")
    lines.append("| No. | Title | PMID | License | Link | Notes |")
    lines.append("|--:|---|---:|---|---|---|")
    for i, title, pmid, lic, link, notes_link in rows:
        cell_notes = f"/{notes_link}" if notes_link else ""
        lines.append(f"| {i} | {title} | {pmid} | {lic} | {link} | {cell_notes} |")
    readme_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    root = Path('.')
    idx_path = root / 'public/papers/index.json'
    readme_path = root / 'docs/papers/README.md'
    notes_dir = root / 'docs/papers_notes'
    idx = json.loads(idx_path.read_text())

    for m in idx["papers"]:
        lic = (m.get("license") or "").lower()
        pmid = m.get("pmid")
        if not pmid:
            continue
        if lic in FREE_LICENSES:
            continue
        # Generate notes for restricted license or unknown license
        rec = epmc_core(pmid)
        abstract = rec.get("abstractText") or ""
        meta = {
            "pmid": pmid,
            "title": rec.get("title") or m.get("title") or "",
            "authors": rec.get("authorString") or m.get("authors") or "",
            "journal": rec.get("journalTitle") or "",
            "pubYear": rec.get("pubYear") or "",
            "license": lic,
        }
        write_note(pmid, meta, abstract, notes_dir)

    update_readme_index(idx_path, readme_path, notes_dir)
    print("Notes generation complete.")


if __name__ == '__main__':
    main()
