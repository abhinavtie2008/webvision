import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  service_slug TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'DL',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  draft TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  stored_name TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  UNIQUE (application_id, kind)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message_en TEXT NOT NULL,
  message_hi TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  receipt_no TEXT UNIQUE,
  card_last4 TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS centres (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  address_en TEXT NOT NULL,
  address_hi TEXT NOT NULL,
  district TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  centre_id TEXT NOT NULL REFERENCES centres(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  booked INTEGER NOT NULL DEFAULT 0,
  UNIQUE (centre_id, date, time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES slots(id),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_app ON events(application_id);
CREATE INDEX IF NOT EXISTS idx_docs_app ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
`;

export const CENTRES = [
  {
    id: 'dl-mall-road',
    name_en: 'Mall Road Zonal Office',
    name_hi: 'मॉल रोड ज़ोनल कार्यालय',
    address_en: 'Mall Road, Near ISBT Kashmere Gate, Delhi 110006',
    address_hi: 'मॉल रोड, आईएसबीटी कश्मीरी गेट के पास, दिल्ली 110006',
    district: 'North Delhi',
  },
  {
    id: 'dl-janakpuri',
    name_en: 'Janakpuri Zonal Office',
    name_hi: 'जनकपुरी ज़ोनल कार्यालय',
    address_en: 'C Block, Janakpuri, New Delhi 110058',
    address_hi: 'सी ब्लॉक, जनकपुरी, नई दिल्ली 110058',
    district: 'West Delhi',
  },
  {
    id: 'dl-sarai-kale-khan',
    name_en: 'Sarai Kale Khan Zonal Office',
    name_hi: 'सराय काले खाँ ज़ोनल कार्यालय',
    address_en: 'Sarai Kale Khan, New Delhi 110013',
    address_hi: 'सराय काले खाँ, नई दिल्ली 110013',
    district: 'South East Delhi',
  },
  {
    id: 'dl-rohini',
    name_en: 'Rohini Zonal Office',
    name_hi: 'रोहिणी ज़ोनल कार्यालय',
    address_en: 'Sector 5, Rohini, Delhi 110085',
    address_hi: 'सेक्टर 5, रोहिणी, दिल्ली 110085',
    district: 'North West Delhi',
  },
  {
    id: 'dl-loni-road',
    name_en: 'Loni Road Zonal Office',
    name_hi: 'लोनी रोड ज़ोनल कार्यालय',
    address_en: 'Loni Road, Shahdara, Delhi 110032',
    address_hi: 'लोनी रोड, शाहदरा, दिल्ली 110032',
    district: 'North East Delhi',
  },
];

const TIMES = ['09:30', '10:30', '11:30', '14:00', '15:00'];

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;
}

export function generateReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tail = '';
  for (let i = 0; i < 6; i += 1) {
    tail += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `DL-${new Date().getFullYear()}-${tail}`;
}

export function maskMobile(mobile) {
  if (!mobile || String(mobile).length < 4) return '••••••••••';
  return `••••••${String(mobile).slice(-4)}`;
}

export function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA journal_mode = WAL');
  } catch {
    // WAL is unavailable on some filesystems; the default journal is fine.
  }
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  seedCentresAndSlots(db);
  return db;
}

function isoDate(offsetDays) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function seedCentresAndSlots(db) {
  const insertCentre = db.prepare(
    `INSERT OR IGNORE INTO centres (id, name_en, name_hi, address_en, address_hi, district)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const c of CENTRES) {
    insertCentre.run(c.id, c.name_en, c.name_hi, c.address_en, c.address_hi, c.district);
  }

  const insertSlot = db.prepare(
    `INSERT OR IGNORE INTO slots (id, centre_id, date, time, capacity, booked)
     VALUES (?, ?, ?, ?, ?, 0)`,
  );

  // Keep a rolling 10-day window of appointments. Sundays are closed.
  for (let day = 0; day <= 10; day += 1) {
    const date = isoDate(day);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 0) continue;
    CENTRES.forEach((centre, centreIndex) => {
      TIMES.forEach((time, timeIndex) => {
        const capacity = 3 + ((day + centreIndex + timeIndex) % 4);
        insertSlot.run(`${centre.id}_${date}_${time}`, centre.id, date, time, capacity);
      });
    });
  }
}

export function addEvent(db, applicationId, type, en, hi, at = nowIso()) {
  db.prepare(
    `INSERT INTO events (application_id, type, message_en, message_hi, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(applicationId, type, en, hi, at);
}

export function getApplicationBundle(db, id) {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!app) return null;
  const documents = db
    .prepare('SELECT id, kind, filename, mime, size, uploaded_at FROM documents WHERE application_id = ? ORDER BY uploaded_at')
    .all(id);
  const events = db
    .prepare('SELECT id, type, message_en, message_hi, created_at FROM events WHERE application_id = ? ORDER BY id')
    .all(id);
  const payment = db.prepare('SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC LIMIT 1').get(id) ?? null;
  const booking = db
    .prepare(
      `SELECT b.id, b.created_at, s.id AS slot_id, s.date, s.time, s.capacity, s.booked,
              c.id AS centre_id, c.name_en, c.name_hi, c.address_en, c.address_hi
       FROM bookings b
       JOIN slots s ON s.id = b.slot_id
       JOIN centres c ON c.id = s.centre_id
       WHERE b.application_id = ?`,
    )
    .get(id) ?? null;
  return {
    ...app,
    draft: JSON.parse(app.draft),
    documents,
    events,
    payment,
    booking,
  };
}
