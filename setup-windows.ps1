param([switch]$SkipModels)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    function Invoke-Checked {
        param([string]$Program, [string[]]$Arguments)
        & $Program @Arguments
        if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
    }
    $env:UV_PYTHON_INSTALL_DIR = Join-Path $PSScriptRoot 'backend/.tools/python'
    $env:UV_CACHE_DIR = Join-Path $PSScriptRoot 'backend/.cache/uv'
    $uv = Join-Path $PSScriptRoot 'backend/.tools/uv/bin/uv.exe'
    if (-not (Test-Path -LiteralPath $uv)) {
        Invoke-Checked 'python' @('-m','pip','install','--target','backend/.tools/uv','uv==0.12.15','--disable-pip-version-check')
    }
    Invoke-Checked $uv @('python','install','3.11.16','--no-bin')
    if (-not (Test-Path -LiteralPath 'backend/.venv/Scripts/python.exe')) {
        Invoke-Checked $uv @('venv','backend/.venv','--python','3.11.16','--managed-python')
    }
    Invoke-Checked $uv @('pip','install','--python','backend/.venv/Scripts/python.exe','torch==2.11.0','torchvision==0.26.0','--index-url','https://download.pytorch.org/whl/cu128')
    Invoke-Checked $uv @('pip','install','--python','backend/.venv/Scripts/python.exe','-r','backend/requirements-windows.lock.txt')
    Invoke-Checked $uv @('pip','check','--python','backend/.venv/Scripts/python.exe')
    Invoke-Checked 'npm.cmd' @('ci','--prefix','backend')
    Invoke-Checked 'npm.cmd' @('ci','--prefix','frontend')
    if (-not (Test-Path -LiteralPath 'backend/.env')) {
        Copy-Item -LiteralPath 'backend/.env.example' -Destination 'backend/.env'
        throw 'Configure your real PostgreSQL credentials in backend/.env, then rerun setup.'
    }
    Invoke-Checked 'npm.cmd' @('run','db:setup','--prefix','backend')
    Invoke-Checked 'npm.cmd' @('run','db:check','--prefix','backend')
    if (-not $SkipModels) {
        Invoke-Checked './backend/.venv/Scripts/python.exe' @('backend/scripts/download-models.py')
    }
    Write-Host 'Setup steps finished. Follow SETUP_STATUS.md to start and test all services.'
} finally {
    Pop-Location
}
