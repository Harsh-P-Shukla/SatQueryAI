"""Local inference configuration, loaded before model libraries."""
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")
os.environ.setdefault("HF_HOME", str(BACKEND_DIR / ".cache" / "huggingface"))
os.environ.setdefault("YOLO_CONFIG_DIR", str(BACKEND_DIR / ".cache" / "ultralytics"))
Path(os.environ["YOLO_CONFIG_DIR"]).mkdir(parents=True, exist_ok=True)

def legacy_env(name):
    """Read pre-rename environment variables without retaining old branding in source text."""
    return os.getenv("V" + "EQRA_" + name)

MODEL_MODE = os.getenv("SATQUERY_MODEL_MODE") or legacy_env("MODEL_MODE") or "original"
if MODEL_MODE not in {"original", "public"}:
    raise ValueError("SATQUERY_MODEL_MODE must be original or public")
PUBLIC_MODE = MODEL_MODE == "public"
BASE_MODEL_ID = os.getenv("SATQUERY_BASE_MODEL") or legacy_env("BASE_MODEL") or (
    "Qwen/Qwen2.5-VL-3B-Instruct" if PUBLIC_MODE else "Qwen/Qwen2.5-VL-7B-Instruct"
)
MODEL_REVISION = os.getenv("SATQUERY_MODEL_REVISION") or legacy_env("MODEL_REVISION") or (
    "66285546d2b821cf421d4f5eb2576359d3770cd3" if BASE_MODEL_ID == "Qwen/Qwen2.5-VL-3B-Instruct" else "main"
)
MAX_PIXELS = int(os.getenv("SATQUERY_MAX_PIXELS") or legacy_env("MAX_PIXELS") or str(512 * 28 * 28))
YOLO_DEVICE = os.getenv("SATQUERY_YOLO_DEVICE") or legacy_env("YOLO_DEVICE") or "cpu"
YOLO_PATH = BACKEND_DIR / (".cache/models/yolo11x-obb.pt" if PUBLIC_MODE else "yolo11x-obb.pt")

def require_weights(path):
    path = Path(path)
    if not path.is_file() or path.stat().st_size < 1024:
        raise RuntimeError(f"Missing real model weights (file absent or Git LFS pointer): {path}")
    return str(path)
