import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dbFile = process.env.DB_FILE || path.join(root, 'data', 'sarathi.db');
const uploads = process.env.UPLOADS_DIR || path.join(root, 'uploads');

for (const file of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) {
  try {
    fs.unlinkSync(file);
    console.log(`Removed ${file}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

if (fs.existsSync(uploads)) {
  for (const file of fs.readdirSync(uploads)) {
    if (file === '.gitkeep') continue;
    fs.rmSync(path.join(uploads, file), { force: true });
  }
  console.log('Cleared uploaded documents');
}

console.log('Demo data reset. Start the server to reseed centres and slots.');
