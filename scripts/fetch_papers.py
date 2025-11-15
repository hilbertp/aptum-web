"""
Fetch open/free-licensed papers (by PMID) from Europe PMC and store PDFs + metadata.

Usage:
  python scripts/fetch_papers.py

Behavior:
  - Parses the hardcoded paper list text below to extract PMIDs
  - Queries Europe PMC for each PMID to retrieve license and full-text URLs
  - Filters to free licenses (cc by, cc0, cc by-sa) and downloads PDF to public/papers
  - Tries Unpaywall fallback (via DOI) when Europe PMC PDF download fails or is absent
  - Writes public/papers/index.json (metadata for all papers)
  - Writes docs/papers/README.md with Title | PMID | License | Link
  - Writes docs/papers/AUDIT.json with summary counts and unresolved externals

Notes:
  - Only free licenses are saved locally; others (or failures) are linked to Europe PMC
  - Extracts Markdown from locally saved free PDFs for easier search (best-effort)
"""

from __future__ import annotations
import json
import os
import re
import time
from typing import List, Dict, Optional, Tuple
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError


PAPER_LIST = r'''
🔬 Aptum CustomGPT Knowledge Base: Paper List with Identifiers
Research Area: 1. Training Science
1.1. Periodization Models: linear, undulating, block
The Evaluation of the Modified Wave Periodization Model Efficiency on the Example of Young Soccer Players' Sprint Tests (PMID: 39563758)
Coaches’ Perceptions of Common Planning Concepts Within Training Theory: An International Survey (PMID: 37989900)
Reverse Periodization for Improving Sports Performance: A Systematic Review (PMID: 35445953)
Addressing the Confusion within Periodization Research (PMID: 33467283)
The Effect of Periodization on Training Program Adherence (PMID: 34948583)
Benefits and Limitations of Block Periodized Training Approaches to Athletes' Preparation: A Review (PMID: 26573916)
Block periodization of endurance training - a systematic review and meta-analysis (PMID: 31802956)
Muscle Daily Undulating Periodization for Strength and Body Composition: The Proposal of a New Model (PMID: 36895841)
The Effect of Block Versus Daily Undulating Periodization on Strength and Performance in Adolescent Football Players (PMID: 30569761)
Effects of Periodization on Strength and Muscle Hypertrophy in Volume-Equated Resistance Training Programs: A Systematic Review and Meta-analysis (PMID: 35044672)
1.2. Autoregulation using RPE and RIR
Concurrent validity and reliability of the session rating of perceived exertion scale among high-trained rower during training sessions (PMID: 40646576)
Gauging proximity to failure in the bench press: generalized velocity-based vs. %1RM-repetitions-to-failure approaches (PMID: 40133968)
Feasibility and Usefulness of Repetitions-In-Reserve Scales for Selecting Exercise Intensity: A Scoping Review (PMID: 38563729)
Modeling the repetitions-in-reserve-velocity relationship: a valid method for resistance training monitoring and prescription, and fatigue management (PMID: 38418370)
Internal Training Load Perceived by Athletes and Planned by Coaches: A Systematic Review and Meta-Analysis (PMID: 35244801)
1.3. Energy systems and metabolic adaptation
The Bioenergetic Basis of Exercise Performance: A Comprehensive Review of ATP Production and Utilization (PMID: 40646577)
Metabolic Adaptations to High-Intensity Interval Training (HIIT) vs. Moderate-Intensity Continuous Training (MICT) in Athletes (PMID: 40133969)
The Role of Lactate in Exercise Metabolism and Performance: Beyond a Waste Product (PMID: 38563730)
Metabolic Adaptations to Endurance Training: A Comprehensive Review (PMID: 39833538)
The Role of Glycogen in Regulating Metabolic Adaptation to Exercise Training: A Critical Review (PMID: 39798840)
Acute and Chronic Metabolic Responses to High-Intensity Interval Training (HIIT): A Systematic Review (PMID: 37989905)
1.4. Skill acquisition and motor learning for mixed athletes
Transfer of Training Effects in Multi-Sport Athletes: A Systematic Review (PMID: 40646578)
Perceptual-Cognitive Skill Training for Enhancing Decision-Making in Complex Sports: A Systematic Review (PMID: 40133970)
Neuromuscular Control and Adaptation in Response to Varied Training Stimuli in Athletes (PMID: 38563731)
Motor Learning Strategies for Enhancing Skill Acquisition in Complex Sports: A Systematic Review (PMID: 39833539)
Neuromuscular Adaptations to Concurrent Training: Implications for Skill Performance in Mixed-Sport Athletes (PMID: 39798841)
The Role of Variability in Practice for Motor Skill Learning in Athletes: A Systematic Review (PMID: 37989906)
Research Area: 2. Recovery Science
2.1. HRV interpretation and autonomic balance
Heart Rate Variability and Training Load in Elite Athletes: A Systematic Review (PMID: 39833534)
Heart Rate Variability, Sleep, and Recovery: A Comprehensive Review (PMID: 39798836)
The Utility of Heart Rate Variability in Monitoring Training Adaptation and Preventing Overtraining in Endurance Athletes: A Systematic Review (PMID: 37989901)
2.2. Sleep architecture and circadian optimization
Sleep Interventions for Enhancing Athletic Performance and Recovery: A Systematic Review and Meta-Analysis (PMID: 39833535)
The Impact of Circadian Rhythm Disruption on Athletic Performance and Injury Risk: A Narrative Review (PMID: 39798837)
Sleep Quality and Quantity in Elite Athletes: A Comprehensive Assessment (PMID: 37989902)
2.3. Nervous-system regulation: vagus tone and stress adaptation
Vagal Tone and Exercise Performance: A Systematic Review and Meta-Analysis (PMID: 39833536)
Stress, Recovery, and Performance in Elite Athletes: The Role of the Autonomic Nervous System (PMID: 39798838)
Heart Rate Variability Biofeedback for Enhancing Stress Resilience and Performance in Athletes: A Systematic Review (PMID: 37989903)
2.4. Deload protocols and active recovery strategies
The Efficacy of Deloading Strategies on Strength and Performance Adaptations in Resistance-Trained Individuals: A Systematic Review (PMID: 39833537)
Active Recovery Strategies for Enhancing Post-Exercise Performance and Reducing Muscle Soreness: A Systematic Review and Meta-Analysis (PMID: 39798839)
The Role of Rest and Recovery in Periodized Training Programs: A Narrative Review (PMID: 37989904)
Research Area: 3. Nutrition and Longevity
3.1. Macronutrient periodization and protein synthesis
Changes in Body Composition and Nutritional Periodization during the Training Macrocycle in Football—A Narrative Review (PMID: 38732581)
Athletes’ nutritional demands: a narrative review of nutritional requirements (PMID: 38328685)
Advances in Understanding the Interplay between Dietary Practices, Body Composition, and Sports Performance in Athletes (PMID: 38398895)
3.2. Intermittent fasting and caloric restriction
Effects of Intermittent Fasting and Calorie Restriction on Exercise Performance: A Systematic Review and Meta-Analysis (PMID: 40573103)
Intermittent Fasting: Does It Affect Sports Performance? A Systematic Review (PMID: 38201996)
Effects of Ramadan intermittent fasting on performance, physiological responses, and bioenergetic pathway contributions during repeated sprint exercise (PMID: 38406182)
The Effects of 24-h Fasting on Exercise Performance and Metabolic Parameters in a Pilot Study of Female CrossFit Athletes (PMID: 38004236)
Intermittent Fasting Promotes Weight Loss without Decreasing Performance in Taekwondo (PMID: 37513549)
3.3. Micronutrient sufficiency and neuroendocrine health
The Importance of Vitamin D and Magnesium in Athletes (PMID: 40431395)
Athletes’ nutritional demands: a narrative review of nutritional requirements (PMID: 38328685)
Exploring the Relationship between Micronutrients and Athletic Performance: A Comprehensive Scientific Systematic Review of the Literature in Sports Medicine (PMID: 37368559)
The importance of bone health for pediatric athletes: From juvenile osteochondritis dissecans to relative energy deficiency in sports (PMID: 40433287)
Considerations for the Consumption of Vitamin and Mineral Supplements in Athlete Populations (PMID: 37358750)
3.4. Anti-inflammatory and mitochondrial-supportive diets
Sports nutrition knowledge, source of nutrition information and dietary consumption pattern of Ugandan endurance athletes: a cross-sectional study of the Sebei sub-region (PMID: 40317037)
Athletes’ nutritional demands: a narrative review of nutritional requirements (PMID: 38328685)
Diet Inflammatory Index among Regularly Physically Active Young Women and Men (PMID: 38201892)
Popular Dietary Trends’ Impact on Athletic Performance: A Critical Analysis Review (PMID: 37630702)
Use of the Dietary Inflammatory Index to Assess the Diet of Young Physically Active Men (PMID: 35682467)
Research Area: 4. Contextual Aptum Data
Utilizing Wearable Technology for Personalized Exercise Prescription and Monitoring: A Systematic Review (PMID: 40646579)
Artificial Intelligence in Personalized Exercise and Sports: Current Applications and Future Directions (PMID: 40133971)
The Role of Self-Reported Data and Wearable Sensors in Personalized Health Interventions: A Scoping Review (PMID: 38563732)
Data Integration from Multiple Wearable Devices for Comprehensive Physiological Monitoring in Athletes (PMID: 37989907)
'''


def epmc_core(pmid: str) -> dict:
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:{pmid}&resultType=core&format=json"
    with urlopen(Request(url, headers={"User-Agent": "aptum-fetch/1.0"})) as r:
        data = json.loads(r.read().decode())
    results = data.get("resultList", {}).get("result", [])
    return results[0] if results else {}


FREE_LICENSES = {"cc by", "cc0", "cc by-sa"}


def ensure_dir(p: str):
    os.makedirs(p, exist_ok=True)


def http_fetch(url: str, retries: int = 3, sleep_s: float = 0.5) -> Tuple[Optional[bytes], str]:
    """Fetch a URL with basic retry; returns (bytes or None, content_type)."""
    last_ct = ""
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": "aptum-fetch/1.0"})
            with urlopen(req, timeout=30) as r:
                last_ct = (r.headers.get("Content-Type") or "").lower()
                data = r.read()
            return data, last_ct
        except (HTTPError, URLError) as e:
            if attempt == retries - 1:
                return None, last_ct
            time.sleep(sleep_s * (attempt + 1))
        except Exception:
            if attempt == retries - 1:
                return None, last_ct
            time.sleep(sleep_s * (attempt + 1))
    return None, last_ct


def main():
    pmids = re.findall(r"PMID:\s*(\d+)", PAPER_LIST)
    pmids_unique = list(dict.fromkeys(pmids))
    print(f"Found {len(pmids)} entries; {len(pmids_unique)} unique PMIDs")

    ensure_dir("public/papers")
    ensure_dir("public/papers_md")
    ensure_dir("docs/papers")

    meta_all: List[Dict] = []
    free_count = 0
    for i, pmid in enumerate(pmids_unique, 1):
        rec = epmc_core(pmid)
        lic = (rec.get("license") or "").lower()
        is_oa = (rec.get("isOpenAccess") or "").upper() == "Y"
        title = rec.get("title") or ""
        authors = rec.get("authorString") or ""
        full_urls = rec.get("fullTextUrlList", {}).get("fullTextUrl", [])

        # Prefer PMC mirror via PMCID if available (pmc.ncbi.nlm.nih.gov tends to be robust)
        pdf_url = None
        pmcid = None
        ftids = rec.get("fullTextIdList", {}).get("fullTextId", [])
        if ftids:
            for fid in ftids:
                if str(fid).upper().startswith("PMC"):
                    pmcid = str(fid).upper()
                    break
        if pmcid:
            # Try US PMC first, then Europe PMC variants
            candidates = [
                f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/pdf",
                f"https://europepmc.org/articles/{pmcid}/pdf",
                f"https://europepmc.org/articles/{pmcid}?pdf=render",
            ]
            # choose the first we can fetch successfully below
        else:
            for u in full_urls:
                if u.get("documentStyle") == "pdf" and u.get("availabilityCode") in ("OA", "S", "FREE"):
                    pdf_url = u.get("url")
                    break

        save_local = is_oa and lic in FREE_LICENSES and (pmcid or pdf_url)
        local_path = None
        download_error: Optional[str] = None
        if save_local:
            free_count += 1
            local_path = f"public/papers/{pmid}.pdf"
            try:
                data = None
                ct = ""
                tried = []
                if pmcid:
                    for cand in candidates:
                        tried.append(cand)
                        data, ct = http_fetch(cand)
                        if data and (data.startswith(b"%PDF-") or "pdf" in ct):
                            pdf_url = cand
                            break
                        data = None
                if data is None and pdf_url:
                    tried.append(pdf_url)
                    data, ct = http_fetch(pdf_url)
                if not data or (not data.startswith(b"%PDF-") and "pdf" not in ct):
                    raise RuntimeError(f"not a pdf (ct={ct}) from {pdf_url or 'pmcid candidates'}")
                with open(local_path, "wb") as f:
                    f.write(data)
                print(f"[{i:02d}] saved {pmid}.pdf under free license {lic}")
            except Exception as e:
                download_error = str(e)
                print(f"[{i:02d}] failed to download PDF for {pmid}: {e}")
                local_path = None

        # Fallback via Unpaywall if needed (DOI-based)
        fallback_url = None
        fallback_via = None
        if (local_path is None) and is_oa and (lic in FREE_LICENSES):
            doi = (rec.get("doi") or "").strip()
            email = os.environ.get("UNPAYWALL_EMAIL", "bot+ii-agent@users.noreply.github.com")
            if doi:
                try:
                    up_url = f"https://api.unpaywall.org/v2/{doi}?email={email}"
                    with urlopen(Request(up_url, headers={"User-Agent": "aptum-fetch/1.0"})) as r:
                        up = json.loads(r.read().decode())
                    locs = up.get("oa_locations") or []

                    def norm_lic(s: Optional[str]) -> str:
                        return (s or "").lower().replace("-", " ")

                    chosen = None
                    for pref_host in ("repository", "publisher"):
                        for loc in locs:
                            if loc.get("url_for_pdf") and loc.get("host_type") == pref_host and norm_lic(loc.get("license")) in FREE_LICENSES:
                                chosen = loc
                                break
                        if chosen:
                            break
                    if not chosen:
                        best = up.get("best_oa_location") or {}
                        if best.get("url_for_pdf") and norm_lic(best.get("license")) in FREE_LICENSES:
                            chosen = best
                    if chosen:
                        cand_url = chosen.get("url_for_pdf")
                        try:
                            req = Request(cand_url, headers={"User-Agent": "aptum-fetch/1.0"})
                            with urlopen(req) as r:
                                ct = (r.headers.get("Content-Type") or "").lower()
                                data = r.read()
                            if not data.startswith(b"%PDF-") and "pdf" not in ct:
                                raise RuntimeError(f"not a pdf (ct={ct})")
                            local_path = f"public/papers/{pmid}.pdf"
                            with open(local_path, "wb") as f:
                                f.write(data)
                            print(f"[{i:02d}] saved via Unpaywall fallback {pmid}.pdf")
                            fallback_url = cand_url
                            fallback_via = "unpaywall"
                        except Exception as e:
                            print(f"[{i:02d}] Unpaywall fallback failed for {pmid}: {e}")
                            local_path = None
                except Exception as e:
                    print(f"[{i:02d}] Unpaywall query failed for {pmid}: {e}")

        meta = {
            "pmid": pmid,
            "title": title,
            "authors": authors,
            "license": lic,
            "isOpenAccess": is_oa,
            "pdf_url": pdf_url,
            "local_path": local_path,
            "source": f"https://europepmc.org/abstract/MED/{pmid}",
            "download_error": download_error,
            "fallback_pdf_url": fallback_url,
            "fallback_via": fallback_via,
        }
        meta_all.append(meta)
        time.sleep(0.08)

    # Write index.json
    with open("public/papers/index.json", "w", encoding="utf-8") as f:
        json.dump({"generatedAt": time.time(), "freeCount": sum(1 for m in meta_all if m.get("isOpenAccess") and m.get("license") in FREE_LICENSES), "papers": meta_all}, f, ensure_ascii=False, indent=2)

    # Markdown extraction for locally saved free PDFs
    try:
        import subprocess
        try:
            import pdfminer  # type: ignore
        except Exception:
            subprocess.run(["python", "-m", "pip", "-q", "install", "pdfminer.six"], check=False)
        from pdfminer.high_level import extract_text  # type: ignore
        for m in meta_all:
            if m.get("local_path") and (m.get("license") in FREE_LICENSES):
                pdf_fp = m["local_path"]
                md_fp = f"public/papers_md/{m['pmid']}.md"
                try:
                    text = extract_text(pdf_fp)
                    with open(md_fp, "w", encoding="utf-8") as outf:
                        outf.write(f"---\npmid: {m['pmid']}\nlicense: {m.get('license','')}\nsource: {m.get('source','')}\ntitle: {m.get('title','').replace(':',' -')}\n---\n\n")
                        outf.write((text or "").strip() + "\n")
                except Exception as e:
                    print("markdown-extract failed", m['pmid'], e)
    except Exception as e:
        print("skip markdown conversion:", e)

    # README with table
    lines = []
    lines.append("# Aptum Papers Archive (Free Licenses Only)\n")
    lines.append("This folder contains locally archived PDFs for papers with free/redistributable licenses (CC BY, CC0, CC BY-SA).")
    lines.append("Papers with other open-access licenses (e.g., CC BY-NC-ND) are linked externally.")
    lines.append("\nFor free-licensed papers we also provide extracted Markdown in public/papers_md/ for easier search (best-effort extraction).\n")
    lines.append("")
    lines.append("| No. | Title | PMID | License | Link |")
    lines.append("|--:|---|---:|---|---|")
    for idx, m in enumerate(meta_all, 1):
        title = (m.get("title") or "").replace("|", "-")
        pmid = m["pmid"]
        lic = m.get("license") or ""
        if m.get("local_path"):
            link = f"/public/papers/{pmid}.pdf"
        else:
            link = m.get("pdf_url") or m.get("source")
        lines.append(f"| {idx} | {title} | {pmid} | {lic} | {link} |")

    with open("docs/papers/README.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    # Audit summary
    try:
        free_total = sum(1 for m in meta_all if m.get("isOpenAccess") and m.get("license") in FREE_LICENSES)
        local_saved = sum(1 for m in meta_all if m.get("local_path"))
        external_free_pmids = sorted([m["pmid"] for m in meta_all if m.get("isOpenAccess") and m.get("license") in FREE_LICENSES and not m.get("local_path")])
        audit = {
            "free_total": free_total,
            "local_saved": local_saved,
            "external_free_pmids": external_free_pmids,
        }
        with open("docs/papers/AUDIT.json", "w", encoding="utf-8") as af:
            json.dump(audit, af, indent=2)
    except Exception as e:
        print("failed to write audit:", e)

    print("\nSaved index, README, and audit.")


if __name__ == "__main__":
    main()
