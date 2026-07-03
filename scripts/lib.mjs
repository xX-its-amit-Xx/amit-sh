// Shared helpers for the build-time data fetchers.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function loadConfig() {
  const raw = await readFile(join(ROOT, "integrations.config.json"), "utf8");
  return JSON.parse(raw);
}

export function generatedPath(name) {
  return join(ROOT, "src", "generated", name);
}

// Write JSON only if we actually got data — otherwise keep the last good copy.
export async function writeGenerated(name, data) {
  await writeFile(generatedPath(name), JSON.stringify(data, null, 2) + "\n");
}

export async function readGenerated(name) {
  try {
    return JSON.parse(await readFile(generatedPath(name), "utf8"));
  } catch {
    return null;
  }
}

export async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": "amit-sh-builder", ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

export async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": "amit-sh-builder", ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

export const log = (...a) => console.log("[build-data]", ...a);
