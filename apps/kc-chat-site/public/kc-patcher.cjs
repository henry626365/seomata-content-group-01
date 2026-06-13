#!/usr/bin/env node
/**
 * patcher.cjs — One-shot patcher for kc.kc-chat-panel 5.9.0
 *
 * 流程:
 *   1. 读取 dist/_enc/*.enc → AES-256-GCM 解密 → 拿到明文 JS
 *   2. AST 定位三条防线并 NOP 掉(指纹识别,不依赖混淆后的变量名):
 *      - 上报/杀进程函数 I() / H() — body 内含 "integrity_tampered" 字面量
 *      - 反调试自毁函数 sr()       — body 内调用 activateHoneyTraps
 *      - webview 心跳宽限期常量    — _authStartupGraceMs = 8000 → MAX_SAFE_INTEGER
 *   3. 同 masterKey 重新 AES-256-GCM 加密 → 写回 .enc(原文件先备份)
 *
 * 用法:
 *   关闭 Cursor 后:
 *     node patcher.cjs --check     # 仅 dry-run,显示会改什么
 *     node patcher.cjs --apply     # 真改
 *     node patcher.cjs --restore   # 从 .backup 还原
 *
 * 防线矩阵详见 DEFENSE-MATRIX.md
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// =========================================================================
// 1) 配置
// =========================================================================
// Auto-detect extension dir (matches kc.kc-chat-panel-*)
function detectExtDir() {
  const root = "C:/Users/wang/.cursor/extensions";
  const candidates = fs
    .readdirSync(root)
    .filter((n) => n.startsWith("kc.kc-chat-panel-"))
    .map((n) => ({ n, full: path.join(root, n), mtime: fs.statSync(path.join(root, n)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (candidates.length === 0) throw new Error("no kc.kc-chat-panel-* extension dir found under " + root);
  return candidates[0].full;
}
const EXT_DIR = detectExtDir();
const ENC_DIR = path.join(EXT_DIR, "dist", "_enc");
const BACKUP_SUFFIX = ".kcpatch-backup";

const PART_A = "8aadab4de495597af2608955f18a7fca72677ddb60d9bd272fe68d61dc8ef923";
const PART_B = "0071ebc2dbeec0362506fd2d80a36635fce1351c14773737f020eef5e09384b2";
const SUFFIX = ":kc-enc-v1";
const masterKeyHex = crypto.createHash("sha256").update(PART_A + ":" + PART_B + SUFFIX).digest("hex");

// Envelope: 'KCE1' + ver(1) + salt(16) + iv(12) + tag(16) + ct
const MAGIC = Buffer.from("KCE1");
const VER = 0x01;
const SALT_LEN = 16, IV_LEN = 12, TAG_LEN = 16;
const HEADER = MAGIC.length + 1 + SALT_LEN + IV_LEN + TAG_LEN;

// =========================================================================
// 2) 加/解密
// =========================================================================
function decryptEnc(buf) {
  if (buf.length < HEADER + 1) throw new Error("too short");
  if (!buf.subarray(0, 4).equals(MAGIC)) throw new Error("bad magic");
  if (buf[4] !== VER) throw new Error("bad version: " + buf[4]);
  let pos = 5;
  const salt = buf.subarray(pos, pos + SALT_LEN); pos += SALT_LEN;
  const iv = buf.subarray(pos, pos + IV_LEN); pos += IV_LEN;
  const tag = buf.subarray(pos, pos + TAG_LEN); pos += TAG_LEN;
  const ct = buf.subarray(pos);
  const key = crypto.pbkdf2Sync(masterKeyHex, salt, 10000, 32, "sha512");
  const dec = crypto.createDecipheriv("aes-256-gcm", key, iv);
  dec.setAuthTag(tag);
  return { plain: Buffer.concat([dec.update(ct), dec.final()]), salt };
}

function encryptEnc(plain, salt = null) {
  if (!salt) salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = crypto.pbkdf2Sync(masterKeyHex, salt, 10000, 32, "sha512");
  const cip = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cip.update(plain), cip.final()]);
  const tag = cip.getAuthTag();
  return Buffer.concat([MAGIC, Buffer.from([VER]), salt, iv, tag, ct]);
}

// Roundtrip self-test
function selfTestCrypto() {
  const sample = Buffer.from("hello, KCE1 ----- " + crypto.randomBytes(32).toString("hex"));
  const env = encryptEnc(sample);
  const back = decryptEnc(env).plain;
  if (!back.equals(sample)) throw new Error("crypto self-test FAILED");
}

// =========================================================================
// 3) AST patch (acorn)
// =========================================================================
const acorn = require("acorn");

function findFunctionByMarker(src, ast, markerStrings) {
  /** Find top-level function/var declarations whose body contains ALL `markerStrings`. */
  const results = [];
  function visit(node) {
    if (!node || typeof node.type !== "string") return;
    const isFunc =
      node.type === "FunctionDeclaration" ||
      (node.type === "FunctionExpression" && node.id) ||
      node.type === "ArrowFunctionExpression";
    if (isFunc && node.body && typeof node.body.start === "number") {
      const slice = src.slice(node.body.start, node.body.end);
      if (markerStrings.every((m) => slice.includes(m))) {
        results.push({
          name: (node.id && node.id.name) || "<anonymous>",
          start: node.start, end: node.end,
          bodyStart: node.body.start, bodyEnd: node.body.end,
          params: node.params.map((p) => p.name || "_").join(", "),
        });
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === "object" && typeof v.type === "string") visit(v);
    }
  }
  visit(ast);
  return results;
}

const PATCH_LOG_MARK = "/* KC-PATCH v1 :: NOP-by-agent-6 */";

function nopBody(originalParams) {
  return `{ ${PATCH_LOG_MARK} return; }`;
}

function patchSource(src, fileLabel) {
  const log = [];
  let ast;
  try {
    ast = acorn.parse(src, {
      ecmaVersion: "latest",
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      allowHashBang: true,
    });
  } catch (e) {
    throw new Error(`AST parse failed for ${fileLabel}: ${e.message}`);
  }

  // -- 防线 1: I() / H() — body 内有 "integrity_tampered" + "matrix_lethal"
  const killers = findFunctionByMarker(src, ast, ["integrity_tampered", "matrix_lethal", "forceDestroyExtension"]);
  // -- 防线 2: sr() — body 内有 activateHoneyTraps + reportSecurityEvent
  const antiDebugSelfDestruct = findFunctionByMarker(src, ast, ["activateHoneyTraps"]);
  // Both lists may overlap; dedupe by start offset
  const targets = new Map();
  for (const t of [...killers, ...antiDebugSelfDestruct]) targets.set(t.start, t);

  // Sort descending so end offsets stay valid as we replace
  const targetList = [...targets.values()].sort((a, b) => b.start - a.start);

  let out = src;
  for (const t of targetList) {
    const replacement = nopBody(t.params);
    out = out.slice(0, t.bodyStart) + replacement + out.slice(t.bodyEnd);
    log.push(`  - NOP function ${t.name}(${t.params}) @[${t.bodyStart}..${t.bodyEnd}] (${t.bodyEnd - t.bodyStart} → ${replacement.length} chars)`);
  }

  // -- 防线 3: webview 心跳宽限期 _authStartupGraceMs = 8000
  const graceRe = /var\s+_authStartupGraceMs\s*=\s*\d+\s*;/g;
  const graceMatches = [...out.matchAll(graceRe)];
  for (const m of graceMatches) {
    out = out.slice(0, m.index) + `var _authStartupGraceMs = 9007199254740991; ${PATCH_LOG_MARK}` + out.slice(m.index + m[0].length);
    log.push(`  - Bump _authStartupGraceMs → MAX_SAFE_INTEGER @[${m.index}]`);
  }

  return { patched: out, log };
}

// =========================================================================
// 4) 文件级 apply / restore
// =========================================================================
function listEncFiles() {
  if (!fs.existsSync(ENC_DIR)) throw new Error("ENC_DIR missing: " + ENC_DIR);
  return fs.readdirSync(ENC_DIR).filter((f) => f.endsWith(".enc"));
}

function runApply(dryRun) {
  console.log(`=== KC patcher (${dryRun ? "DRY-RUN" : "APPLY"}) ===`);
  console.log(`ENC_DIR: ${ENC_DIR}`);
  console.log(`masterKey: ${masterKeyHex.slice(0, 16)}...${masterKeyHex.slice(-8)}\n`);

  const files = listEncFiles();
  let touched = 0, skipped = 0, failed = 0;
  for (const f of files) {
    const inPath = path.join(ENC_DIR, f);
    const backupPath = inPath + BACKUP_SUFFIX;
    console.log(`--- ${f} ---`);
    try {
      const raw = fs.readFileSync(inPath);
      const { plain } = decryptEnc(raw);
      const result = patchSource(plain.toString("utf8"), f);
      if (result.log.length === 0) {
        console.log(`  (no defense markers found, skipping)`);
        skipped++;
        continue;
      }
      for (const l of result.log) console.log(l);

      if (dryRun) {
        const projected = encryptEnc(Buffer.from(result.patched, "utf8")).length;
        console.log(`  → would re-encrypt: orig=${raw.length}B, new≈${projected}B`);
        touched++;
        continue;
      }

      if (!fs.existsSync(backupPath)) fs.copyFileSync(inPath, backupPath);
      const newEnv = encryptEnc(Buffer.from(result.patched, "utf8"));
      fs.writeFileSync(inPath, newEnv);
      console.log(`  ✓ patched & re-encrypted (orig=${raw.length}B, new=${newEnv.length}B)`);
      touched++;
    } catch (e) {
      console.log(`  ✗ FAILED: ${e.message}`);
      failed++;
    }
    console.log();
  }
  console.log(`=== SUMMARY: touched=${touched} skipped=${skipped} failed=${failed} ===`);
  if (!dryRun && failed === 0 && touched > 0) {
    console.log("\nNext steps:");
    console.log("  1) Add to hosts (optional but recommended): 127.0.0.1 xiaochenha.xyz");
    console.log("  2) Launch Cursor — extension should load without server check");
    console.log("  3) If anything blows up, run `node patcher.cjs --restore`");
  }
}

function runRestore() {
  console.log("=== KC patcher RESTORE ===");
  const files = listEncFiles();
  let restored = 0, missing = 0;
  for (const f of files) {
    const inPath = path.join(ENC_DIR, f);
    const backupPath = inPath + BACKUP_SUFFIX;
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, inPath);
      console.log(`  ✓ restored ${f}`);
      restored++;
    } else {
      console.log(`  (no backup for ${f})`);
      missing++;
    }
  }
  console.log(`=== restored=${restored} missing=${missing} ===`);
}

// =========================================================================
// 5) entrypoint
// =========================================================================
function main() {
  selfTestCrypto();
  const args = process.argv.slice(2);
  if (args.includes("--restore")) return runRestore();
  if (args.includes("--apply")) return runApply(false);
  if (args.includes("--check") || args.length === 0) return runApply(true);
  console.error("usage: node patcher.cjs [--check|--apply|--restore]");
  process.exit(1);
}

try {
  main();
} catch (e) {
  console.error("FATAL:", e.message);
  console.error(e.stack);
  process.exit(2);
}
