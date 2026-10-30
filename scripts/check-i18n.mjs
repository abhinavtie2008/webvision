import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const srcDir = join(root, 'src');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
  return out;
}

const i18nSource = readFileSync(join(srcDir, 'i18n.tsx'), 'utf8');
const defined = new Map();
for (const match of i18nSource.matchAll(/^\s*'([^']+)':\s*\{\s*(en|hi):/gm)) {
  defined.set(match[1], (defined.get(match[1]) ?? 0) + 1);
}
const duplicates = [...defined].filter(([, count]) => count > 1).map(([key]) => key);

const used = new Map();
for (const file of walk(srcDir)) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\b(?:t|errorText)\(\s*'([^']+)'/g)) {
    if (!used.has(match[1])) used.set(match[1], new Set());
    used.get(match[1]).add(relative(root, file));
  }
}

const ERROR_PREFIX = 'errors.';
const missing = [...used].filter(([key]) => !defined.has(key) && !defined.has(ERROR_PREFIX + key));

const serverCodes = new Set();
for (const file of walk(join(root, 'server'))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/code:\s*'([A-Z_]+)'/g)) serverCodes.add(match[1]);
}
const missingCodes = [...serverCodes].filter((code) => !defined.has(ERROR_PREFIX + code));

console.log(`i18n keys: ${defined.size} defined, ${used.size} literal usages.`);
for (const key of duplicates) console.log(`DUPLICATE  ${key}`);
for (const [key, files] of missing) console.log(`MISSING    ${key}  <- ${[...files].join(', ')}`);
for (const code of missingCodes) console.log(`MISSING    ${ERROR_PREFIX}${code}  <- server error code`);

if (duplicates.length || missing.length || missingCodes.length) process.exitCode = 1;
else console.log('OK — no duplicate or missing keys.');
