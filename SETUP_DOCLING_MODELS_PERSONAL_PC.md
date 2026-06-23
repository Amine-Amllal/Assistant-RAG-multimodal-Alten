# Task: download Docling model weights and publish them as a GitHub Release asset

You are a coding agent running on the author's **personal computer** (no corporate
network/proxy restrictions). You were handed this repo specifically to perform one task:
download two ML model repos that Hugging Face hosts, and publish them as a GitHub Release
asset so they can be retrieved later from a different, restricted machine.

## Context (why this task exists)

This repo (`Assistant-RAG-multimodal-Alten`) is a multimodal RAG assistant built during a
2-month internship (see `CLAUDE.md` at the repo root for the full project context). The
backend (`backend/app/`) uses **Docling** to parse PDF/Word documents. Docling's PDF
pipeline always loads two ML models at runtime, regardless of configuration:

- `docling-project/docling-layout-heron` (page layout detection)
- `docling-project/docling-models` (table structure recognition, "TableFormer")

These are normally downloaded automatically from Hugging Face Hub on first use. **On the
author's actual work machine**, this download is blocked: that machine sits behind a
corporate Zscaler proxy (an installed agent, not just a network-level proxy — switching
Wi-Fi/hotspot does not bypass it, and the author is an intern with no path to get IT to
whitelist anything). Confirmed via testing on that machine:
- Hugging Face direct download: `403 Forbidden` on `cas-bridge.xethub.hf.co` (HF's storage
  CDN — all HF repos now route large files through this, regardless of format/mirror).
- `hf-mirror.com`: redirects back to the same blocked HF origin.
- ModelScope: blocked too (`403`).
- An ONNX export of the same model: still routes through the same blocked CDN.
- **What does work** on that machine: `github.com`, `raw.githubusercontent.com`,
  `codeload.github.com`, and GitHub Release assets — these are not blocked.

So the plan is: use this personal computer (no such block) to fetch the models once, then
hand them to the corporate machine via a GitHub Release attached to this same repo, since
GitHub itself is reachable from there.

## Your task, step by step

1. Make sure you're working inside a clone of this exact repo (you should already be in it,
   or `git clone https://github.com/Amine-Amllal/Assistant-RAG-multimodal-Alten.git`).

2. Set up the backend Python environment:
   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\pip.exe install -r requirements.txt
   ```
   (The `requirements.txt` CPU-only torch install flag used on the corporate machine isn't
   needed here — a normal `pip install` is fine on this machine.)

3. Download the two model repos into a clean local folder using Docling's own offline-prep
   CLI (do **not** try to hand-copy the Hugging Face cache — this CLI produces a clean,
   portable folder structure instead of HF's internal blob/symlink cache layout):
   ```powershell
   .venv\Scripts\docling-tools.exe models download layout tableformer -o docling_models_offline
   ```
   This will reach out to Hugging Face normally (works fine here, no proxy) and may take a
   few minutes — the TableFormer weights alone are roughly 350+ MB.

4. Verify the folder was populated (it should contain subfolders named after each model,
   each with a `config.json` and weight files):
   ```powershell
   Get-ChildItem docling_models_offline -Recurse | Select-Object FullName, Length
   ```

5. Zip it up:
   ```powershell
   Compress-Archive -Path docling_models_offline -DestinationPath docling_models_offline.zip
   ```
   Check the zip size — GitHub Releases allow up to 2GB per asset, so this should be well
   within range, but confirm before uploading.

6. Publish it as a **GitHub Release** on this repo (not a git commit — these files are far
   too large for a normal commit, and don't belong in git history):
   - Go to `https://github.com/Amine-Amllal/Assistant-RAG-multimodal-Alten/releases/new`
   - Tag: `docling-models-v1` (or similar)
   - Title: anything descriptive, e.g. "Docling offline model weights (layout + tableformer)"
   - Drag `docling_models_offline.zip` into the asset upload area
   - Publish the release

7. Confirm back to the user once the release is live, with the release URL.

## What happens after this (for your context, not your task)

Back on the corporate machine, the backend already has support for loading these models
from a local folder instead of downloading them — see `DOCLING_ARTIFACTS_PATH` in
`backend/.env.example` and how it's consumed in `backend/app/services/docling_parser.py`
(`pdf_pipeline_options.artifacts_path = settings.DOCLING_ARTIFACTS_PATH`). Once the release
asset is downloaded there (GitHub is reachable from that network) and unzipped, that env var
just needs to point at the unzipped `docling_models_offline` folder and Docling will never
attempt a network call for these models again.

You do not need to do anything on the corporate-machine side — just get the zip published.
