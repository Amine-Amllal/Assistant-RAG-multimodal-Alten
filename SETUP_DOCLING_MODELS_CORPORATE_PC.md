# Task: install the pre-downloaded Docling models on the corporate laptop

This is the follow-up to `SETUP_DOCLING_MODELS_PERSONAL_PC.md`. That task has already been
done: the two Docling model repos (`docling-project/docling-layout-heron` and
`docling-project/docling-models`) were downloaded on an unrestricted personal machine and
published as a GitHub Release asset on this same repo, because GitHub itself (unlike
Hugging Face's storage CDN) is reachable from the corporate network despite the Zscaler proxy.

Release: https://github.com/Amine-Amllal/Assistant-RAG-multimodal-Alten/releases/tag/docling-models-v1

You are now running on the **corporate, Zscaler-restricted laptop**. Your task is to fetch
that release asset and wire it up so the backend never tries to reach Hugging Face for these
models.

## Steps

1. Download the asset `docling_models_offline.zip` (~492 MB) from the release page above.
   `github.com`, `objects.githubusercontent.com` and `codeload.github.com` are reachable on
   this network, so a normal browser download or `Invoke-WebRequest` should work. If a direct
   `Invoke-WebRequest`/`curl` to the asset URL fails, just download it via the browser instead.

2. Unzip it inside `backend/`, so you end up with:
   ```
   backend/docling_models_offline/
     docling-project--docling-layout-heron/...
     docling-project--docling-models/...
   ```
   ```powershell
   cd backend
   Expand-Archive -Path docling_models_offline.zip -DestinationPath . -Force
   ```

3. Verify the folder structure looks right:
   ```powershell
   Get-ChildItem docling_models_offline -Recurse -Depth 1
   ```
   You should see `config.json` and `*.safetensors` files under each of the two model
   subfolders.

4. Edit `backend/.env` (create it from `backend/.env.example` if it doesn't exist yet) and set:
   ```
   DOCLING_ARTIFACTS_PATH=./docling_models_offline
   ```
   This is consumed in `backend/app/services/docling_parser.py`
   (`pdf_pipeline_options.artifacts_path = settings.DOCLING_ARTIFACTS_PATH`) — when set,
   Docling loads the models from this local folder instead of attempting a Hugging Face
   download, so the Zscaler-blocked `cas-bridge.xethub.hf.co` CDN is never contacted.

5. Confirm `truststore.inject_into_ssl()` is still in place at the top of
   `backend/app/__init__.py` (it should already be there per `CLAUDE.md`) — this is unrelated
   to the model loading but needed for other outbound HTTPS calls (Mistral, HF Inference API)
   to pass Zscaler's TLS inspection without `CERTIFICATE_VERIFY_FAILED` errors.

6. Run the backend and parse a test PDF from `docs/test_corpus/` to confirm Docling loads the
   models from the local folder with no network call to Hugging Face (watch the logs — there
   should be no `huggingface.co` or `xethub.hf.co` request for the layout/tableformer models).

7. Once confirmed working, you can delete `backend/docling_models_offline.zip` (keep the
   unzipped folder) — no need to keep both. Do **not** commit `docling_models_offline/` or the
   zip to git; they're already large binary artifacts that belong in the Release, not in git
   history (add `docling_models_offline*` to `backend/.gitignore` if not already ignored).
