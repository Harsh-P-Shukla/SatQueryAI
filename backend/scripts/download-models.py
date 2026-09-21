"""Fetch only the public profile's inference artifacts, not training datasets."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from inference_config import BASE_MODEL_ID, MODEL_REVISION, PUBLIC_MODE, YOLO_PATH
from huggingface_hub import snapshot_download
from urllib.request import urlretrieve
import hashlib

if not PUBLIC_MODE:
    raise SystemExit("Set SATQUERY_MODEL_MODE=public before using the public model downloader.")

YOLO_SHA256 = "1461342db1ce0f35c755278303febd1174604ccc375110076fa0ac155231b6a0"
def sha256(path):
    with open(path, "rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

if not YOLO_PATH.exists() or sha256(YOLO_PATH) != YOLO_SHA256:
    YOLO_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = YOLO_PATH.with_suffix(".download")
    urlretrieve("https://github.com/ultralytics/assets/releases/download/v8.4.0/yolo11x-obb.pt", temporary)
    if sha256(temporary) != YOLO_SHA256:
        raise RuntimeError("YOLO download checksum mismatch")
    temporary.replace(YOLO_PATH)
print(f"YOLO verified: {YOLO_PATH}", flush=True)
snapshot = snapshot_download(
    BASE_MODEL_ID,
    revision=MODEL_REVISION,
    allow_patterns=["*.json", "*.safetensors", "*.txt", "*.model", "LICENSE", "README.md"],
    max_workers=2,
)
print(f"Qwen snapshot ready: {snapshot}", flush=True)
