#!/usr/bin/env node
/**
 * kc-activate.cjs — KC Chat Panel one-click activation helper
 *
 * What it does:
 *   1. Detects your Cursor machine id and derives device_hash (dh)
 *   2. POSTs your card code + dh to YOUR_SERVER/api/card/activate
 *   3. Gets back { token, install_secret, ia, ea }
 *   4. Writes them into Cursor's state.vscdb so the extension picks them up
 *   5. (Optional) closes Cursor first so the DB isn't locked
 *
 * Usage:
 *   node kc-activate.cjs <SERVER_URL> <CARD_CODE>
 *   node kc-activate.cjs https://cursor.h540.com KC-XXXX-XXXX-XXXX
 *
 *   Flags:
 *     --no-close     Don't try to kill Cursor before writing (default: kill)
 *     --print        Only print, don't inject
 *     --dh <hex16>   Override auto-detected device_hash
 *
 * Requires: Node.js 18+. NO external npm packages.
 *
 * Disclaimer: For licensing a copy of KC Chat Panel that you've legitimately
 * paid for via the issuing site. Do not use to redistribute / resell.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const { spawnSync } = require("child_process");

// ────────────────────────── arg parse ──────────────────────────
const args = process.argv.slice(2);
let server = "";
let card = "";
let noClose = false;
let printOnly = false;
let dhOverride = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--no-close") noClose = true;
  else if (a === "--print") printOnly = true;
  else if (a === "--dh") dhOverride = (args[++i] || "").toLowerCase();
  else if (a === "-h" || a === "--help") {
    console.log(fs.readFileSync(__filename, "utf8").match(/\/\*\*[\s\S]*?\*\//)[0]);
    process.exit(0);
  } else if (!server) server = a;
  else if (!card) card = a.trim().toUpperCase();
}
if (!server || !card) {
  console.error("usage: node kc-activate.cjs <SERVER_URL> <CARD_CODE>");
  console.error("example: node kc-activate.cjs https://cursor.h540.com KC-A1B2-C3D4-E5F6");
  process.exit(2);
}
server = server.replace(/\/$/, "");

// ────────────────────────── paths ──────────────────────────
const CURSOR_USER_DIR = (() => {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Cursor", "User");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Cursor", "User");
  }
  return path.join(os.homedir(), ".config", "Cursor", "User");
})();
const GLOBAL_STORAGE = path.join(CURSOR_USER_DIR, "globalStorage");
const STATE_DB = path.join(GLOBAL_STORAGE, "state.vscdb");
const MACHINE_ID_FILE = path.join(GLOBAL_STORAGE, "storage.json");

function bail(msg, code = 1) {
  console.error(`[error] ${msg}`);
  process.exit(code);
}

// ────────────────────────── 1) device hash ──────────────────────────
// Replicates the extension's getMachineId() (Te) / Mi() exactly:
//   1. Try cached ~/.kc-device-id (32-char hex of Te)
//   2. Else: wmic CSProduct UUID | wmic baseboard SerialNumber | wmic bios SerialNumber
//      → sha256(joined).hex().slice(0, 32) = Te
//   3. dh = sha256(Te).hex().slice(0, 16)
const KC_DEVICE_ID_FILE = path.join(os.homedir(), ".kc-device-id");

function exec(cmd) {
  try {
    const r = spawnSync(process.platform === "win32" ? "cmd" : "sh", [process.platform === "win32" ? "/c" : "-c", cmd], {
      encoding: "utf8", timeout: 8000,
    });
    return (r.stdout || "").trim();
  } catch { return ""; }
}

function readCsproductUuid() {
  if (process.platform !== "win32") return "";
  const out = exec("wmic csproduct get uuid");
  const m = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).find((l) => /^[0-9A-F-]{36}$/i.test(l));
  if (m && m !== "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") return m;
  return exec('powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID"').trim();
}

function readBaseboardSerial() {
  if (process.platform === "win32") {
    const out = exec("wmic baseboard get serialnumber");
    const m = out.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && l !== "SerialNumber" && l.length > 2)[0];
    if (m) return m;
    return exec('powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_BaseBoard).SerialNumber"').trim();
  }
  if (process.platform === "linux") return exec("cat /sys/class/dmi/id/board_serial 2>/dev/null");
  return "";
}

function readBiosSerial() {
  if (process.platform === "win32") {
    const out = exec("wmic bios get serialnumber");
    const m = out.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && l !== "SerialNumber" && l.length > 2)[0];
    if (m) return m;
    return exec('powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_BIOS).SerialNumber"').trim();
  }
  if (process.platform === "linux") return exec("cat /sys/class/dmi/id/bios_serial 2>/dev/null");
  return "";
}

function readLinuxMachineId() {
  for (const p of ["/etc/machine-id", "/sys/class/dmi/id/product_uuid", "/var/lib/dbus/machine-id"]) {
    try { if (fs.existsSync(p)) { const v = fs.readFileSync(p, "utf-8").trim(); if (v && v.length >= 16) return v; } } catch {}
  }
  return "";
}

function readDarwinUuid() {
  const out = exec("ioreg -rd1 -c IOPlatformExpertDevice");
  const m = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
  return m ? m[1] : "";
}

function computeTeAndDh() {
  // 1) Cached?
  try {
    if (fs.existsSync(KC_DEVICE_ID_FILE)) {
      const cached = fs.readFileSync(KC_DEVICE_ID_FILE, "utf-8").trim();
      if (/^[0-9a-f]{32}$/i.test(cached)) {
        const dh = crypto.createHash("sha256").update(cached).digest("hex").slice(0, 16);
        return { source: "~/.kc-device-id cache", te: cached, dh };
      }
    }
  } catch {}

  // 2) Compute from hw
  const parts = [];
  if (process.platform === "win32") {
    const u = readCsproductUuid(); if (u) parts.push(u);
    const b = readBaseboardSerial(); if (b) parts.push(b);
    const i = readBiosSerial(); if (i) parts.push(i);
  } else if (process.platform === "darwin") {
    const u = readDarwinUuid(); if (u) parts.push(u);
  } else {
    const m = readLinuxMachineId(); if (m) parts.push(m);
  }
  // Fallback if all hw probes failed
  if (parts.length === 0) {
    parts.push(os.hostname(), os.platform(), os.arch(), os.cpus().map((c) => c.model).join(","));
  }
  const joined = parts.join("|");
  const te = crypto.createHash("sha256").update(joined).digest("hex").slice(0, 32);
  const dh = crypto.createHash("sha256").update(te).digest("hex").slice(0, 16);
  return { source: `wmic/hw (parts=${parts.length})`, te, dh, debug: joined };
}

function detectMachineId() {
  if (dhOverride) return { source: "--dh override", dh: dhOverride, te: "(provided)" };
  return computeTeAndDh();
}

function findSqliteExe() {
  // We piggyback on the sqlite3.exe shipped by kc.kc-chat-panel itself, OR look in PATH.
  const extDir = path.join(os.homedir(), ".cursor", "extensions");
  if (fs.existsSync(extDir)) {
    for (const d of fs.readdirSync(extDir)) {
      if (!d.startsWith("kc.kc-chat-panel-")) continue;
      const exe = path.join(extDir, d, "resources", "sqlite3", process.platform === "win32" ? "win32-x64" : process.platform + "-" + process.arch, process.platform === "win32" ? "sqlite3.exe" : "sqlite3");
      if (fs.existsSync(exe)) return exe;
    }
  }
  // PATH lookup
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", ["sqlite3"], { encoding: "utf8" });
  if (probe.status === 0) {
    const p = (probe.stdout || "").split(/\r?\n/)[0].trim();
    if (p) return p;
  }
  return null;
}

const SQLITE = findSqliteExe();
if (!SQLITE) bail("Could not find sqlite3 executable. Install Cursor + KC Chat Panel first, or put sqlite3 on PATH.");
if (!fs.existsSync(STATE_DB)) bail(`state.vscdb not found at ${STATE_DB}. Launch Cursor at least once before activating.`);

const mid = detectMachineId();
const dh = mid.dh;
console.log(`[info] device source    : ${mid.source}`);
console.log(`[info] Te (machine id)  : ${mid.te}`);
console.log(`[info] device hash (dh) : ${dh}`);
console.log(`[info] card             : ${card}`);
console.log(`[info] server           : ${server}`);

// ────────────────────────── 2) call activation API ──────────────────────────
async function activate() {
  const url = `${server}/api/card/activate`;
  const body = JSON.stringify({ code: card, device_hash: dh });
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "kc-activate/1.0" },
    body,
  }).catch((e) => bail(`Network error: ${e.message}`));
  const txt = await res.text();
  let data;
  try { data = JSON.parse(txt); } catch { bail(`Non-JSON response (${res.status}): ${txt.slice(0, 200)}`); }
  if (!data.ok) bail(`Server rejected: [${data.code}] ${data.message}`);
  return data;
}

// ────────────────────────── 3) write state.vscdb ──────────────────────────
function killCursor() {
  if (process.platform === "win32") {
    const r = spawnSync("taskkill", ["/F", "/IM", "Cursor.exe", "/T"], { encoding: "utf8" });
    if (r.status === 0) console.log("[info] closed Cursor.exe");
    else console.log("[info] Cursor not running (or already closed)");
  } else {
    spawnSync("pkill", ["-f", "Cursor"], { encoding: "utf8" });
  }
}

function readGlobalState() {
  const r = spawnSync(SQLITE, ["-readonly", STATE_DB, "SELECT value FROM ItemTable WHERE key='kc.kc-chat-panel'"], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (r.status !== 0) bail(`sqlite3 read failed: ${r.stderr}`);
  return JSON.parse(r.stdout || "{}");
}

function writeGlobalState(state) {
  const json = JSON.stringify(state).replace(/'/g, "''");
  const sqlFile = path.join(os.tmpdir(), `kc-activate-${Date.now()}.sql`);
  fs.writeFileSync(sqlFile, `UPDATE ItemTable SET value='${json}' WHERE key='kc.kc-chat-panel';`, "utf-8");
  const r = spawnSync(SQLITE, [STATE_DB], {
    input: `.read ${sqlFile.replace(/\\/g, "/")}\n.exit\n`,
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
  try { fs.unlinkSync(sqlFile); } catch {}
  if (r.status !== 0) bail(`sqlite3 write failed: ${r.stderr || "(no stderr)"}. Most common cause: Cursor still running; close it then retry.`);
}

// ────────────────────────── main ──────────────────────────
(async () => {
  const result = await activate();
  console.log(`\n[ok] server issued token (tier=${result.tier_label || result.tier})`);
  console.log(`     issued  : ${new Date(result.ia).toISOString()}`);
  console.log(`     expires : ${new Date(result.ea).toISOString()}`);
  console.log(`     token   : ${result.token.slice(0, 60)}...`);

  if (printOnly) {
    console.log(`\n[print mode] not writing to state.vscdb. To inject manually:`);
    console.log(`  kc-patch-gate-token = ${result.token}`);
    console.log(`  kc.nq.installCred.v1 = ${JSON.stringify({ installSecret: result.install_secret, installId: dh })}`);
    return;
  }

  if (!noClose) killCursor();

  // Wait up to 3s for DB lock release
  await new Promise((r) => setTimeout(r, 1500));

  const state = readGlobalState();
  state["kc-patch-gate-token"]      = result.token;
  state["kc.nq.installCred.v1"]     = JSON.stringify({ installSecret: result.install_secret, installId: dh });
  state["kc-license-activated-at"]  = new Date(result.ia).toISOString().slice(0, 19).replace("T", " ");
  state["kc-license-expires-at"]    = new Date(result.ea).toISOString().slice(0, 19).replace("T", " ");
  state["kc-license-key-type"]      = result.tier || "card";
  state["kc-license-permissions"]   = ["no_quota"];
  state["kc-license-last-licensed"] = true;
  state["kc-license-next-check"]    = result.ea;

  writeGlobalState(state);

  console.log(`\n✓ Activation complete. Launch Cursor — extension should report Activated.`);
  console.log(`  expires: ${state["kc-license-expires-at"]}`);
})().catch((e) => bail(e?.message || String(e)));
