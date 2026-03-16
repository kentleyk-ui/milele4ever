import fs from 'fs';
import path from 'path';

const dirToClean = [
  '.next',
  '.turbopack',
  'node_modules/.cache'
];

console.log('[v0] Starting cache cleanup...');

dirToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`[v0] Removed ${dir}`);
    } catch (err) {
      console.log(`[v0] Could not remove ${dir}: ${err.message}`);
    }
  }
});

console.log('[v0] Cache cleanup complete. Please restart the dev server.');
