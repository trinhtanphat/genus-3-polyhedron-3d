$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Run-Step([string]$Name, [scriptblock]$Action) {
  Write-Host "=== $Name ==="
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

Run-Step 'exact combinatorics/topology' { node verify.mjs }

function Resolve-Python {
  $candidates = @()

  if ($env:LOCALAPPDATA) {
    $local = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python*\python.exe') -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending
    if ($local) { $candidates += @($local.FullName) }
  }

  $userLocal = Get-ChildItem -Path 'C:\Users\*\AppData\Local\Programs\Python\Python*\python.exe' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending
  if ($userLocal) { $candidates += @($userLocal.FullName) }

  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { $candidates += @($python.Source) }

  $python3 = Get-Command python3 -ErrorAction SilentlyContinue
  if ($python3) { $candidates += @($python3.Source) }

  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (-not (Test-Path $candidate)) { continue }
    $versionText = (& $candidate --version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -eq 0 -and $versionText -match '^Python\s+3(?:\.|$)') {
      return $candidate
    }
  }

  return $null
}

$pythonExe = Resolve-Python
if ($pythonExe) {
  if (Test-Path 'main.tex') {
    Run-Step 'primary-source transcription' { & $pythonExe verify_source.py }
  } else {
    Write-Host '=== primary-source transcription ==='
    Write-Host 'SKIP: main.tex is intentionally not redistributed; provide the arXiv source locally to run this optional gate.'
  }
  Run-Step 'exact pairwise geometry' { & $pythonExe verify_geometry.py }
} else {
  $py = Get-Command py -ErrorAction SilentlyContinue
  if (-not $py) { throw 'Python 3 is required for verify_geometry.py' }
  if (Test-Path 'main.tex') {
    Run-Step 'primary-source transcription' { py -3 verify_source.py }
  } else {
    Write-Host '=== primary-source transcription ==='
    Write-Host 'SKIP: main.tex is intentionally not redistributed; provide the arXiv source locally to run this optional gate.'
  }
  Run-Step 'exact pairwise geometry' { py -3 verify_geometry.py }
}

Run-Step 'presentation contract' { node verify_presentation.mjs }
Run-Step 'renderer triangulation' { node verify_render.mjs }
Run-Step 'web/runtime source integrity' { node verify_web.mjs }
Run-Step 'JavaScript syntax' { node --check app.js }
Run-Step 'git working-tree whitespace check' { git diff --check }
Run-Step 'git staged whitespace check' { git diff --cached --check }

Write-Host '=== GitHub Actions quota guard ==='
$workflows = git ls-files | Select-String '^\.github/workflows/'
if ($workflows) {
  $workflows | ForEach-Object { Write-Host $_ }
  throw 'GitHub Actions workflow files are tracked; this repository is intended to deploy from branch without Actions.'
}
Write-Host 'PASS: no tracked .github/workflows files.'

Write-Host '=== basic tracked-secret pattern scan ==='
$patterns = '(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|api[_-]?key[[:space:]]*=|secret[[:space:]]*=|password[[:space:]]*=|token[[:space:]]*=)'
$hits = git grep -n -I -E $patterns -- ':!vendor/**' ':!README.md' ':!NOTICE.md' 2>$null
if ($LASTEXITCODE -eq 0) {
  $hits | ForEach-Object { Write-Host $_ }
  throw 'Potential tracked secret pattern found.'
}
Write-Host 'PASS: no tracked secret patterns found.'

Write-Host 'ALL REPOSITORY AUDIT GATES PASS.'
