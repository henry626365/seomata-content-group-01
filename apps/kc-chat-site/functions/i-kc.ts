// GET /i-kc — polyglot install script.
//   Windows:  irm https://cursor.h540.com/i-kc | iex
//   *nix:     curl -fsSL https://cursor.h540.com/i-kc | bash
//
// Detects User-Agent → serves PowerShell or POSIX bash. Both scripts:
//   1. Pre-flight checks (Cursor installed, Node 18+, kc.kc-chat-panel extension folder exists)
//   2. Download kc-patcher.cjs + kc-activate.cjs to a local workdir
//   3. Run patcher (apply or check, depending on flags)
//   4. Print next-step: how to run kc-activate.cjs with the user's card code

import type { Env } from "./env.d";

const PS_SCRIPT = (origin: string) => `#Requires -Version 5
$ErrorActionPreference = 'Stop'
$BASE = '${origin}'
$WORK = Join-Path $env:LOCALAPPDATA 'kc-chat'
New-Item -ItemType Directory -Force -Path $WORK | Out-Null

Write-Host ''
Write-Host '┌─ KC Chat installer ─────────────────────────────────────'
Write-Host "│ work dir:   $WORK"
Write-Host "│ server:     $BASE"
Write-Host '└─────────────────────────────────────────────────────────'

# 1) Pre-flight
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host '[!] Node.js not found. Install from https://nodejs.org/ (LTS) and re-run.' -ForegroundColor Red
  exit 1
}
$ver = (& $node.Source --version).Trim() -replace '^v',''
$major = [int]($ver -split '\\.')[0]
if ($major -lt 18) {
  Write-Host "[!] Node $ver is too old; need >= 18." -ForegroundColor Red
  exit 1
}

$extRoot = Join-Path $env:USERPROFILE '.cursor\\extensions'
if (-not (Test-Path $extRoot)) {
  Write-Host '[!] Cursor extensions dir not found. Install Cursor (https://cursor.com) then KC Chat from Marketplace first.' -ForegroundColor Red
  exit 1
}
$kc = Get-ChildItem -Path $extRoot -Directory -Filter 'kc.kc-chat-panel-*' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $kc) {
  Write-Host '[!] Extension kc.kc-chat-panel not installed. Open Cursor → Extensions → search "KC Chat" → Install, then re-run.' -ForegroundColor Red
  exit 1
}
Write-Host "[ok] Found extension: $($kc.Name)"
Write-Host "[ok] Node:           v$ver"
Write-Host ''

# 2) Download helpers
function Get-File($url, $out) {
  Write-Host "  ↓ $url"
  Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop
}
Get-File "$BASE/kc-patcher.cjs"  (Join-Path $WORK 'kc-patcher.cjs')
Get-File "$BASE/kc-activate.cjs" (Join-Path $WORK 'kc-activate.cjs')

# 3) Patch the extension
Write-Host ''
Write-Host '── running kc-patcher.cjs --apply ──────────────────────'
& node (Join-Path $WORK 'kc-patcher.cjs') --apply
if ($LASTEXITCODE -ne 0) {
  Write-Host '[!] Patcher failed. See output above.' -ForegroundColor Red
  exit $LASTEXITCODE
}

# 4) Next steps
Write-Host ''
Write-Host '╔════════════════════════════════════════════════════════╗' -ForegroundColor Green
Write-Host '║  Installation OK. Next: activate with your card.       ║' -ForegroundColor Green
Write-Host '╚════════════════════════════════════════════════════════╝' -ForegroundColor Green
Write-Host ''
Write-Host "  cd $WORK"
Write-Host "  node kc-activate.cjs $BASE KC-XXXX-XXXX-XXXX"
Write-Host ''
Write-Host '  Replace KC-XXXX-XXXX-XXXX with your purchased card code.'
Write-Host "  More help: $BASE/tutorial"
`;

const SH_SCRIPT = (origin: string) => `#!/usr/bin/env bash
set -euo pipefail
BASE='${origin}'
WORK="$HOME/.kc-chat"
mkdir -p "$WORK"

echo ''
echo '┌─ KC Chat installer ─────────────────────────────────────'
echo "│ work dir:   $WORK"
echo "│ server:     $BASE"
echo '└─────────────────────────────────────────────────────────'

# 1) pre-flight
if ! command -v node >/dev/null 2>&1; then
  echo '[!] Node.js not found. Install from https://nodejs.org/ (LTS) and re-run.' >&2; exit 1
fi
NODE_MAJOR=$(node --version | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[!] Node $(node --version) is too old; need >= 18." >&2; exit 1
fi

EXT_ROOT="$HOME/.cursor/extensions"
if [ ! -d "$EXT_ROOT" ]; then
  echo '[!] Cursor extensions dir not found. Install Cursor + KC Chat extension first.' >&2; exit 1
fi
KC_DIR=$(ls -1d "$EXT_ROOT"/kc.kc-chat-panel-* 2>/dev/null | head -1 || true)
if [ -z "$KC_DIR" ]; then
  echo '[!] kc.kc-chat-panel not installed. Install from marketplace first.' >&2; exit 1
fi
echo "[ok] Found extension: $(basename "$KC_DIR")"
echo "[ok] Node:           $(node --version)"
echo ''

# 2) download helpers
echo "  ↓ $BASE/kc-patcher.cjs"
curl -fsSL "$BASE/kc-patcher.cjs"  -o "$WORK/kc-patcher.cjs"
echo "  ↓ $BASE/kc-activate.cjs"
curl -fsSL "$BASE/kc-activate.cjs" -o "$WORK/kc-activate.cjs"

# 3) patch
echo ''
echo '── running kc-patcher.cjs --apply ──────────────────────'
node "$WORK/kc-patcher.cjs" --apply

# 4) next steps
echo ''
echo '╔════════════════════════════════════════════════════════╗'
echo '║  Installation OK. Next: activate with your card.       ║'
echo '╚════════════════════════════════════════════════════════╝'
echo ''
echo "  cd \\"$WORK\\""
echo "  node kc-activate.cjs $BASE KC-XXXX-XXXX-XXXX"
echo ''
echo "  Replace KC-XXXX-XXXX-XXXX with your purchased card code."
echo "  More help: $BASE/tutorial"
`;

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  // Detect shell — PowerShell Invoke-WebRequest / Invoke-RestMethod sends "WindowsPowerShell" or "Mozilla/5.0 ... PowerShell/x.x".
  const isWindows = /powershell|windows nt|microsoft/.test(ua) || url.searchParams.has("ps");
  const body = isWindows ? PS_SCRIPT(origin) : SH_SCRIPT(origin);
  const contentType = isWindows ? "text/x-powershell; charset=utf-8" : "text/x-shellscript; charset=utf-8";

  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
      "x-shell-detected": isWindows ? "powershell" : "bash",
    },
  });
};
