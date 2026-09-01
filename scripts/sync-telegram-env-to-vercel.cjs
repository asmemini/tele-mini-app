/**
 * Copies TELEGRAM_* from Magster Admin .env.local into Mini App .env.local
 * and Vercel, without printing secret values.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MINI_ROOT = path.resolve(__dirname, "..");
const ADMIN_ENV = path.join("C:", "Users", "Admin", "Music", "magster_admin", ".env.local");
const MINI_ENV = path.join(MINI_ROOT, ".env.local");
const KEYS = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHANNEL_ID"];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const map = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    map[key] = value;
  }
  return map;
}

function upsertEnvFile(filePath, updates) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  let next = existing;
  for (const [key, value] of Object.entries(updates)) {
    if (!value) continue;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    if (pattern.test(next)) next = next.replace(pattern, line);
    else next = `${next.replace(/\s*$/, "")}\n${line}\n`;
  }
  fs.writeFileSync(filePath, next, "utf8");
}

const admin = parseEnvFile(ADMIN_ENV);
const mini = parseEnvFile(MINI_ENV);
const updates = {};
for (const key of KEYS) {
  const value = admin[key] || mini[key] || "";
  if (!value) {
    console.error(`Missing ${key} in Admin and Mini App .env.local`);
    process.exit(1);
  }
  updates[key] = value;
}

upsertEnvFile(MINI_ENV, updates);
console.log("Updated Mini App .env.local keys (values not printed).");

const vercelBin = path.join(MINI_ROOT, "node_modules", ".bin", "vercel.cmd");
const vercelCmd = fs.existsSync(vercelBin) ? vercelBin : "npx";
const vercelArgsPrefix = fs.existsSync(vercelBin) ? [] : ["vercel"];

function runVercel(args, input) {
  const result = spawnSync(
    vercelCmd,
    [...vercelArgsPrefix, ...args],
    {
      cwd: MINI_ROOT,
      encoding: "utf8",
      input,
      shell: process.platform === "win32",
      timeout: 120000,
    },
  );
  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0) {
    console.error(`vercel ${args.join(" ")} failed with status ${result.status}`);
    console.error(combined.replace(/[0-9]{8,}:[A-Za-z0-9_-]+/g, "[redacted]"));
  } else {
    console.log(`vercel ${args[0]} ${args[1] || ""} ${args[2] || ""} ok`);
  }
  return result.status === 0;
}

let ok = true;
for (const key of KEYS) {
  for (const target of ["production", "preview", "development"]) {
    runVercel(["env", "rm", key, target, "-y"]);
    if (!runVercel(["env", "add", key, target], `${updates[key]}\n`)) ok = false;
  }
}

if (!ok) process.exit(1);
console.log("Vercel env updated. Deploy separately if needed.");
