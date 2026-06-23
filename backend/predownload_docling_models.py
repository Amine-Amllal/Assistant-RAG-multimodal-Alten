"""Run this ONCE while connected to a network that is NOT behind the corporate
Zscaler proxy (phone hotspot, home Wi-Fi, etc.). It pre-downloads the two model
repos Docling needs into the local Hugging Face cache (~/.cache/huggingface),
so that running the backend on the corporate network afterward never needs to
reach the blocked cas-bridge.xethub.hf.co CDN again.

Usage:
    backend\\.venv\\Scripts\\python.exe backend\\predownload_docling_models.py
"""

from huggingface_hub import snapshot_download

REPOS = [
    "docling-project/docling-layout-heron",
    "docling-project/docling-models",
]

for repo_id in REPOS:
    print(f"Downloading {repo_id} ...")
    snapshot_download(repo_id=repo_id)
    print(f"Done: {repo_id}")

print("All Docling model repos are now cached locally.")
