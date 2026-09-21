# SatQuery AI Windows setup

Updated 2026-09-16. **The selected public-model setup is running and the full API smoke test passes.** Scope: the existing single-image SatQuery AI app using public Qwen + YOLO, as approved by the user. PostgreSQL is retained. This does not implement all six proposed workflows from the research deck.

## Machine and versions

- Workspace: `<project-root>`.
- Node 24.11.1, npm 11.6.2; React 19.2.0, Vite 7.2.4, existing Express 5.
- PostgreSQL 18.6, Windows service `postgresql-x64-18`, port 5432.
- System Python 3.14.2 is unchanged. Project Python 3.11.16 lives under `backend/.tools/python`, with environment `backend/.venv`.
- uv 0.12.15 is installed under `backend/.tools/uv`.
- RTX 5050 Laptop GPU: 8151 MiB VRAM, compute capability 12.0, driver 592.82.
- Machine RAM: approximately 24.8 GB; close other memory-heavy applications if loading fails.
- PyTorch 2.11.0+cu128, torchvision 0.26.0+cu128; CUDA matrix multiplication passed. No separate CUDA toolkit was installed.
- Transformers 4.57.6, PEFT 0.18.0, bitsandbytes 0.50.2; NF4 GPU calculation passed. FastAPI 0.141.1, Uvicorn 0.53.0, Ultralytics 8.4.153.
- Exact 75-package Python environment: `backend/requirements-windows.lock.txt`. Dependency consistency and runtime imports pass.

## Database and credentials

Database `isro_gi` contains `users`, `chats`, `messages`. Source schema: `backend/postgres.txt`. Foreign keys cascade user-to-chat and chat-to-message deletion.

Credentials are read from Git-ignored `backend/.env`. Required variables: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`. Defaults for host/port/database are localhost/5432/isro_gi; credentials have no hardcoded defaults. No passwords or tokens belong in documentation, source, or browser configuration.

Setup and checks, from the project root:

```powershell
npm.cmd run db:setup --prefix backend
npm.cmd run db:check --prefix backend
npm.cmd run test:api --prefix backend
```

The last command needs Node running. Schema setup is repeatable and does not delete existing data. The DB test rolls back fixtures. The API test creates a uniquely named temporary user, verifies the persisted bcrypt hash, then deletes its test user and upload.

Passed: connection, table creation, INSERT/SELECT, JSONB, unique email, both foreign keys, cascading deletion, registration, login, wrong-password rejection, duplicate-email rejection, empty chat history, upload, byte-for-byte image retrieval, CORS and frontend proxy. Browser signup also passed.

## Models and behavior

- Active profile: `SATQUERY_MODEL_MODE=public`.
- Qwen: `Qwen/Qwen2.5-VL-3B-Instruct`, revision `66285546d2b821cf421d4f5eb2576359d3770cd3`, approximately 7.52 GB downloaded. NF4 inference runs on the GPU.
- Qwen cache: `backend/.cache/huggingface/hub/models--Qwen--Qwen2.5-VL-3B-Instruct`.
- YOLO: `backend/.cache/models/yolo11x-obb.pt`, 118438668 bytes. Its SHA-256 matches the original repository pointer: `1461342db1ce0f35c755278303febd1174604ccc375110076fa0ac155231b6a0`.
- `SATQUERY_YOLO_DEVICE=cpu` preserves GPU headroom for Qwen. CPU YOLO inference passed on `frontend/public/display 1.png`, finding two planes and two storage tanks.
- `SATQUERY_MAX_PIXELS=401408` limits Qwen's image-token memory use; larger images are resized for the VLM. YOLO processes its own image input.
- Optional overrides: `SATQUERY_BASE_MODEL`, `SATQUERY_MODEL_REVISION`, `HF_HOME`, `YOLO_CONFIG_DIR`.
- Both services share `backend/uploads` and `backend/results`; PostgreSQL stores users/chat/message metadata.

The public profile has no custom caption/VQA adapters and no DIOR detector. It is an RGB baseline, not validated scientific SAR/IR interpretation. The frontend displays this distinction. Grounding retains only boxes actually supplied by YOLO. Smoke-test success is not a benchmark-accuracy claim.

Original-model mode remains in source: configure `SATQUERY_MODEL_MODE=original` and `SATQUERY_BASE_MODEL=Qwen/Qwen2.5-VL-7B-Instruct`, obtain the original YOLO/DIOR and caption/VQA weights at the existing paths, then download the appropriate base model. The three custom artifacts are missing from GitHub LFS (404); public Qwen does not recreate them. Original SAR/IR adapters are also absent and requests needing them fail explicitly. Original mode is not verified on this machine.

See `MODEL_SOURCES.md` for the supplied deck's references and the distinction between installed inference components and future dataset/training/fusion work. Full research datasets, CROMA and ChangeFormer/BIT are outside the selected scope.

## Startup sequence

PostgreSQL runs as a Windows service; no terminal is needed for it. Use three terminals from the project root:

Terminal 1 — inference, after models have downloaded:

```powershell
cd <project-root>
.\backend\start-inference.ps1
```

This uses the local virtual environment, offline model cache, localhost port 8000 and one worker. Wait for `Application startup complete` before using the app.

Terminal 2 — Node:

```powershell
cd <project-root>
npm.cmd start --prefix backend
```

Terminal 3 — frontend:

```powershell
cd <project-root>
npm.cmd run dev --prefix frontend
```

- Frontend: http://localhost:5173
- Backend/database health: http://localhost:5000/api/health
- Inference health: http://127.0.0.1:8000/health
- Translation: absent; port 5001 unused. `translateLink` has no consumers and there is no translation implementation/API key requirement. Core app paths do not depend on it.

Stop a foreground service with Ctrl+C. Do not start duplicate instances. Restart Node/Python after changing `.env`. Vite uses strict port 5173 and localhost binding. No ngrok URL is needed.

## Recreate the environment

Install Node and PostgreSQL first, retaining your own credentials. The setup script also needs a bootstrap Python with pip; this machine's existing Python 3.14 fulfills that role without installing AI packages into it.

```powershell
cd <project-root>
.\setup-windows.ps1
```

The script creates isolated Python, installs CUDA PyTorch and locked libraries, installs locked npm dependencies, creates/checks the PostgreSQL schema, and downloads the public models. If `.env` is absent it copies the example and stops for real credentials. `-SkipModels` skips model downloads. This orchestration script was syntax checked; its individual setup operations were executed during setup.

To download/resume models separately:

```powershell
.\backend\.venv\Scripts\python.exe backend/scripts/download-models.py
```

No Hugging Face token is required for the selected public models. Hugging Face may warn about unavailable Windows symlinks; regular-file caching works without changing Windows security settings. Model downloads require roughly 7.7 GB; wheels, caches and the Python environment require additional disk space.

## Verification and source corrections

```powershell
npm.cmd run build --prefix frontend
npm.cmd run test:api --prefix backend
npm.cmd run db:check --prefix backend
.\backend\.venv\Scripts\python.exe backend/scripts/check-inference-helpers.py
npm.cmd run test:e2e --prefix backend
```

The full E2E test requires all services. It covers registration/login, actual image upload/chat creation, captioning, semantic/binary/numeric VQA, grounding artifact retrieval, message persistence, PDF report, partial evaluation and deletion. It uses the included satellite image and stores test output under ignored `backend/.cache/e2e-results.json`. It removes its test user/chat/upload/grounding output; evaluation uploads and generated reports may remain in the ignored output directories.

Build, helper tests and full E2E passed. Python started offline from its local model cache. Direct Python detection and caption requests passed before Node integration. Browser registration, image upload, caption display and numeric VQA passed. Vite reports a nonfatal large-JavaScript-chunk warning.

Measured API smoke timings on the supplied 512x512 aircraft image: chat/detection 1.6 s, caption 8.3 s, semantic VQA 0.5 s, binary VQA 0.5 s, numeric VQA 0.7 s, grounding 15.5 s, caption-only evaluation 6.4 s. Results were `airport`, `Yes`, and `2` respectively. Grounding was separately checked to return exactly two real detector boxes, and the saved image was visually inspected. GPU memory after testing was about 3176 MiB of 8151 MiB. Timings vary by image size and query.

Observed quality limitation: the base model incorrectly called the parked aircraft "flying" in its captions. This is a working public baseline, not the original fine-tuned performance. Counts/grounding passed this example but require broader evaluation before relying on them.

Actual endpoints:

- `POST /api/auth/signup`, `/api/auth/login`
- `POST /api/upload`; `GET /api/uploads/:filename`, `/api/results/:filename`
- `POST /api/chat/new`; `GET /api/chat/user/:userId`, `/api/chat/:chatId/messages`, `/api/chat/:chatId/report`; `DELETE /api/chat/:chatId`
- `POST /api/query/caption`, `/api/query/vqa`, `/api/query/grounding`, `/api/query/evaluate`
- `GET /api/health`, `/api/model-info`
- Python POST `/upload`, `/caption`, `/grounding`, `/binary`, `/numeric_chat`, `/numeric_evaluate`, `/semantic`; GET `/health`

The old README's `/api/query/captioning`, `/api/evaluate` and `/api/translate` routes are not mounted. VQA requires `queryType` equal to semantic, binary or numeric. Existing auth returns basic user information, not a session token; no production authentication redesign was performed. Services are bound locally.

Corrections include environment-based DB credentials, localhost config/CORS, missing frontend lockfile peer dependency, stable file paths, null-safe chat artifact deletion, optional evaluation queries, persisting grounding query text, missing numeric prompt, correct adapter-disable context, repeated-coordinate parsing, and detector-grounded geometry validation. Generated files, credentials, caches and environments are ignored by Git.

## Troubleshooting

- Health 503: check the PostgreSQL service and real `.env` credentials, then restart Node.
- `psql` missing from PATH: use `C:\Program Files\PostgreSQL\18\bin\psql.exe`; Node performs schema setup without it.
- Missing model/cache error: run `download-models.py` with network access before offline startup.
- CUDA memory error: close other GPU apps and reduce `SATQUERY_MAX_PIXELS`; restart inference. Do not silently switch to different weights.
- Full UI upload requires Python inference because upload is followed by chat creation/detection.
- Browser speech recognition depends on browser support; it is distinct from the absent translation service.
- Ports already in use: stop the existing instance before relaunching.
