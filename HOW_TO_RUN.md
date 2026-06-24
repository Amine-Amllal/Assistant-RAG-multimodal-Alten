# How to run the app locally

Two parts to start, in two terminals: the FastAPI backend and the Vite/React frontend.

## 1. Backend (FastAPI)

```powershell
cd backend
python -m venv .venv          # first time only
.venv\Scripts\pip.exe install -r requirements.txt   # first time only
```

Create `backend/.env` from `backend/.env.example` and fill in:
- `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` — Clerk auth keys
- `HF_TOKEN` — Hugging Face token (embeddings + VLM image captioning)
- `MISTRAL_API_KEY` — Mistral AI key (chat answers)
- `DOCLING_ARTIFACTS_PATH` — only needed if Hugging Face is blocked on this network (see
  `SETUP_DOCLING_MODELS_CORPORATE_PC.md`); otherwise leave empty
- `CORS_ALLOWED_ORIGINS` — leave as `http://localhost:5173` for local dev

Start the server:
```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

## 2. Frontend (React + Vite)

```powershell
cd frontend
npm install        # first time only
```

Create `frontend/.env` from `frontend/.env.example` and set `VITE_CLERK_PUBLISHABLE_KEY`.

Start the dev server:
```powershell
npm run dev
```

The app will be live at `http://localhost:5173` and will call the backend at the URL the
frontend code is configured with (default expects the backend on `http://localhost:8000`).

## Notes

- On the corporate laptop, Zscaler intercepts outbound HTTPS — `truststore.inject_into_ssl()`
  runs automatically at backend startup (`backend/app/__init__.py`) to avoid
  `CERTIFICATE_VERIFY_FAILED` errors; no extra setup needed for that.
- If Docling model downloads fail (Hugging Face's storage CDN blocked), follow
  `SETUP_DOCLING_MODELS_CORPORATE_PC.md` to use the pre-downloaded models from the GitHub
  Release instead.
- Backend data (uploads, extracted images, sqlite DB, Chroma vector store) is persisted under
  `backend/data/` (created automatically on first run).
