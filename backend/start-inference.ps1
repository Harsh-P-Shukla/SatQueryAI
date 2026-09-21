$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    # Download explicitly with scripts/download-models.py before launching.
    $previousOffline = $env:HF_HUB_OFFLINE
    $env:HF_HUB_OFFLINE = '1'
    & ./.venv/Scripts/python.exe -m uvicorn final_script:app --host 127.0.0.1 --port 8000
} finally {
    $env:HF_HUB_OFFLINE = $previousOffline
    Pop-Location
}
