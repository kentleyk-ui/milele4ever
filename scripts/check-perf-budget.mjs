import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const buildManifestPath = path.join(nextDir, "build-manifest.json");
const staticChunksDir = path.join(nextDir, "static", "chunks");

const rootMainBudgetKb = Number(process.env.PERF_BUDGET_ROOT_MAIN_KB ?? 450);
const totalChunksBudgetKb = Number(process.env.PERF_BUDGET_TOTAL_CHUNKS_KB ?? 3500);
const individualChunkBudgetKb = Number(process.env.PERF_BUDGET_CHUNK_KB ?? 280);

function toKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function fileSizeSafe(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

if (!fs.existsSync(buildManifestPath)) {
  console.error("[perf-budget] build-manifest.json introuvable. Lance d'abord `pnpm build`.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"));
const rootMainFiles = Array.isArray(manifest.rootMainFiles) ? manifest.rootMainFiles : [];

const rootMainBytes = rootMainFiles.reduce((sum, relPath) => {
  const filePath = path.join(nextDir, relPath.replace(/\//g, path.sep));
  return sum + fileSizeSafe(filePath);
}, 0);

let chunkFiles = [];
if (fs.existsSync(staticChunksDir)) {
  chunkFiles = fs.readdirSync(staticChunksDir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => ({
      name,
      bytes: fileSizeSafe(path.join(staticChunksDir, name)),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

const totalChunkBytes = chunkFiles.reduce((sum, item) => sum + item.bytes, 0);
const oversizedChunks = chunkFiles.filter((item) => toKb(item.bytes) > individualChunkBudgetKb);

const lines = [
  "[perf-budget] Résumé",
  `- rootMain: ${toKb(rootMainBytes)} KB (budget ${rootMainBudgetKb} KB)`,
  `- total static chunks: ${toKb(totalChunkBytes)} KB (budget ${totalChunksBudgetKb} KB)`,
  `- biggest chunks:`
];

for (const item of chunkFiles.slice(0, 8)) {
  lines.push(`  - ${item.name}: ${toKb(item.bytes)} KB`);
}

console.log(lines.join("\n"));

const failures = [];
if (toKb(rootMainBytes) > rootMainBudgetKb) {
  failures.push(`rootMain dépasse le budget (${toKb(rootMainBytes)} KB > ${rootMainBudgetKb} KB)`);
}
if (toKb(totalChunkBytes) > totalChunksBudgetKb) {
  failures.push(`total static chunks dépasse le budget (${toKb(totalChunkBytes)} KB > ${totalChunksBudgetKb} KB)`);
}
if (oversizedChunks.length > 0) {
  failures.push(`chunks individuels trop lourds (> ${individualChunkBudgetKb} KB): ${oversizedChunks.map((c) => `${c.name} (${toKb(c.bytes)} KB)`).join(", ")}`);
}

if (failures.length > 0) {
  console.error("[perf-budget] ECHEC");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[perf-budget] OK");
