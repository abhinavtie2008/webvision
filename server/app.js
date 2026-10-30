import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  openDb,
  nowIso,
  newId,
  generateReference,
  maskMobile,
  addEvent,
  getApplicationBundle,
  CENTRES,
} from './db.js';
import { SERVICES, SERVICE_BY_SLUG, CATEGORIES } from './services-data.js';
import { validateDraft, validatePayment, validateDocument } from './validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB = process.env.DB_FILE || path.join(__dirname, 'data', 'sarathi.db');
const DEFAULT_UPLOADS = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

export const STATES = [
  ['AN', 'Andaman and Nicobar Islands'], ['AP', 'Andhra Pradesh'], ['AR', 'Arunachal Pradesh'],
  ['AS', 'Assam'], ['BR', 'Bihar'], ['CH', 'Chandigarh'], ['CG', 'Chhattisgarh'],
  ['DN', 'Dadra and Nagar Haveli and Daman and Diu'], ['DL', 'Delhi'], ['GA', 'Goa'],
  ['GJ', 'Gujarat'], ['HR', 'Haryana'], ['HP', 'Himachal Pradesh'], ['JK', 'Jammu and Kashmir'],
  ['JH', 'Jharkhand'], ['KA', 'Karnataka'], ['KL', 'Kerala'], ['LA', 'Ladakh'],
  ['LD', 'Lakshadweep'], ['MP', 'Madhya Pradesh'], ['MH', 'Maharashtra'], ['MN', 'Manipur'],
  ['ML', 'Meghalaya'], ['MZ', 'Mizoram'], ['NL', 'Nagaland'], ['OD', 'Odisha'],
  ['PY', 'Puducherry'], ['PB', 'Punjab'], ['RJ', 'Rajasthan'], ['SK', 'Sikkim'],
  ['TN', 'Tamil Nadu'], ['TS', 'Telangana'], ['TR', 'Tripura'], ['UP', 'Uttar Pradesh'],
  ['UK', 'Uttarakhand'], ['WB', 'West Bengal'],
].map(([code, name]) => ({ code, name }));

function fail(res, status, code, message, extra = {}) {
  return res.status(status).json({ error: { code, message, ...extra } });
}

function rateLimit({ windowMs, max, keyFn = (req) => req.ip ?? 'unknown' }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return fail(res, 429, 'RATE_LIMITED', 'Too many attempts. Please wait and try again.');
    }
    return next();
  };
}

function serialiseEvent(row) {
  return {
    id: row.id,
    type: row.type,
    message: { en: row.message_en, hi: row.message_hi },
    at: row.created_at,
  };
}

function serialisePayment(payment, service) {
  if (!payment) return null;
  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: 'INR',
    receiptNo: payment.receipt_no,
    cardLast4: payment.card_last4,
    failureCode: payment.failure_code,
    createdAt: payment.created_at,
    breakdown: service
      ? [
          { label: { en: 'Licence fee', hi: 'लाइसेंस शुल्क' }, amount: 200 },
          { label: { en: 'Learner test fee', hi: 'लर्नर टेस्ट शुल्क' }, amount: Math.max(0, service.fee - 200) },
        ]
      : [],
  };
}

function serialiseBooking(booking) {
  if (!booking) return null;
  return {
    id: booking.id,
    slotId: booking.slot_id,
    date: booking.date,
    time: booking.time,
    centre: {
      id: booking.centre_id,
      name: { en: booking.name_en, hi: booking.name_hi },
      address: { en: booking.address_en, hi: booking.address_hi },
    },
    createdAt: booking.created_at,
  };
}

function docUrl(appId, docId) {
  return `/api/applications/${appId}/documents/${docId}/file`;
}

function serialiseApplication(db, id, { publicView = false } = {}) {
  const bundle = getApplicationBundle(db, id);
  if (!bundle) return null;
  const service = SERVICE_BY_SLUG.get(bundle.service_slug);
  const draft = publicView && bundle.draft?.mobile
    ? { ...bundle.draft, mobile: maskMobile(bundle.draft.mobile) }
    : bundle.draft;
  return {
    id: bundle.id,
    reference: bundle.reference,
    status: bundle.status,
    state: bundle.state,
    draft,
    version: bundle.version,
    createdAt: bundle.created_at,
    updatedAt: bundle.updated_at,
    service,
    documents: bundle.documents.map((doc) => ({
      id: doc.id,
      kind: doc.kind,
      filename: doc.filename,
      mime: doc.mime,
      size: doc.size,
      uploadedAt: doc.uploaded_at,
      url: docUrl(bundle.id, doc.id),
    })),
    events: bundle.events.map(serialiseEvent),
    payment: serialisePayment(bundle.payment, service),
    booking: serialiseBooking(bundle.booking),
  };
}

export function createApp(options = {}) {
  const dbFile = options.dbFile || DEFAULT_DB;
  const uploadsDir = options.uploadsDir || DEFAULT_UPLOADS;
  fs.mkdirSync(uploadsDir, { recursive: true });
  const db = openDb(dbFile);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '6mb' }));

  const paymentLimit = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 20,
    keyFn: (req) => `${req.ip}:${req.params.id}`,
  });
  const lookupLimit = rateLimit({ windowMs: 60 * 1000, max: 8 });
  const uploadLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyFn: (req) => `${req.ip}:${req.params.id}`,
  });

  app.get('/api/health', (req, res) => res.json({ ok: true, time: nowIso() }));

  app.get('/api/meta', (req, res) => {
    res.json({
      categories: CATEGORIES,
      states: STATES,
      centres: CENTRES.map((c) => ({
        id: c.id,
        name: { en: c.name_en, hi: c.name_hi },
        address: { en: c.address_en, hi: c.address_hi },
        district: c.district,
      })),
      demo: true,
    });
  });

  app.get('/api/services', (req, res) => {
    res.json({ services: SERVICES });
  });

  app.get('/api/services/:slug', (req, res) => {
    const service = SERVICE_BY_SLUG.get(req.params.slug);
    if (!service) return fail(res, 404, 'SERVICE_NOT_FOUND', 'That service does not exist.');
    return res.json({ service });
  });

  app.get('/api/slots', (req, res) => {
    const centreId = typeof req.query.centreId === 'string' ? req.query.centreId : '';
    const from = typeof req.query.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)
      ? req.query.from
      : new Date().toISOString().slice(0, 10);
    const rows = db
      .prepare(
        `SELECT s.id, s.centre_id, s.date, s.time, s.capacity, s.booked
         FROM slots s
         WHERE s.date >= ? ${centreId ? 'AND s.centre_id = ?' : ''}
         ORDER BY s.date, s.time, s.centre_id`,
      )
      .all(...(centreId ? [from, centreId] : [from]));
    res.json({
      centres: CENTRES.map((c) => ({
        id: c.id,
        name: { en: c.name_en, hi: c.name_hi },
        address: { en: c.address_en, hi: c.address_hi },
        district: c.district,
      })),
      slots: rows.map((s) => ({
        id: s.id,
        centreId: s.centre_id,
        date: s.date,
        time: s.time,
        capacity: s.capacity,
        booked: s.booked,
        available: Math.max(0, s.capacity - s.booked),
      })),
    });
  });

  app.post('/api/applications', (req, res) => {
    const serviceSlug = String(req.body?.serviceSlug ?? '');
    const service = SERVICE_BY_SLUG.get(serviceSlug);
    if (!service) return fail(res, 404, 'SERVICE_NOT_FOUND', 'That service does not exist.');
    if (!service.applyFlow) {
      return fail(res, 400, 'SERVICE_NOT_SUPPORTED', 'This service is a guide in the demo. The learner licence journey is fully wired up.');
    }
    const state = String(req.body?.state ?? 'DL');
    if (!STATES.some((s) => s.code === state)) return fail(res, 422, 'STATE_INVALID', 'Choose a valid state.');

    const id = newId('app');
    const reference = generateReference();
    const now = nowIso();
    const draft = {
      state,
      category: 'general',
      licenceHistory: 'none',
      vehicleClass: ['LMV'],
    };
    db.prepare(
      `INSERT INTO applications (id, reference, service_slug, state, status, draft, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'DRAFT', ?, 1, ?, ?)`,
    ).run(id, reference, serviceSlug, state, JSON.stringify(draft), now, now);
    addEvent(db, id, 'STARTED', 'Application started', 'आवेदन शुरू हुआ', now);
    return res.status(201).json(serialiseApplication(db, id));
  });

  app.get('/api/applications/by-ref/:reference', (req, res) => {
    const row = db
      .prepare('SELECT id FROM applications WHERE reference = ?')
      .get(String(req.params.reference).toUpperCase());
    if (!row) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that reference number.');
    return res.json(serialiseApplication(db, row.id, { publicView: true }));
  });

  const lookupChallenges = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of lookupChallenges) {
      if (value.expiresAt <= now) lookupChallenges.delete(key);
    }
  }, 60 * 1000).unref();

  app.post('/api/applications/lookup', lookupLimit, (req, res) => {
    const reference = String(req.body?.reference ?? '').trim().toUpperCase();
    if (!reference) return fail(res, 422, 'REFERENCE_REQUIRED', 'Enter your reference number.');
    const row = db.prepare('SELECT * FROM applications WHERE reference = ?').get(reference);
    if (!row) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that reference number.');
    const draft = JSON.parse(row.draft);
    if (!draft.mobile) {
      return fail(res, 409, 'PROFILE_INCOMPLETE', 'This application has no mobile number yet. Open the saved link or finish the first step.');
    }
    const challengeId = crypto.randomUUID();
    lookupChallenges.set(challengeId, {
      applicationId: row.id,
      otp: '123456',
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    return res.json({
      challengeId,
      maskedMobile: maskMobile(draft.mobile),
      demoOtp: '123456',
      expiresInSeconds: 600,
    });
  });

  app.post('/api/applications/lookup/verify', lookupLimit, (req, res) => {
    const challenge = lookupChallenges.get(String(req.body?.challengeId ?? ''));
    if (!challenge || challenge.expiresAt <= Date.now()) {
      return fail(res, 410, 'CHALLENGE_EXPIRED', 'That code has expired. Send a new one.');
    }
    if (challenge.attempts >= 5) {
      lookupChallenges.delete(String(req.body?.challengeId));
      return fail(res, 429, 'TOO_MANY_ATTEMPTS', 'Too many wrong attempts. Send a new code.');
    }
    if (String(req.body?.otp ?? '') !== challenge.otp) {
      challenge.attempts += 1;
      return fail(res, 401, 'OTP_INVALID', 'That code is not correct.', { attemptsLeft: 5 - challenge.attempts });
    }
    lookupChallenges.delete(String(req.body?.challengeId));
    return res.json({ applicationId: challenge.applicationId });
  });

  app.get('/api/applications/:id', (req, res) => {
    const data = serialiseApplication(db, req.params.id);
    if (!data) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    return res.json(data);
  });

  app.patch('/api/applications/:id/draft', (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    if (appRow.status !== 'DRAFT') {
      return fail(res, 409, 'APPLICATION_LOCKED', 'This application has been submitted and can no longer be edited here.', {
        status: appRow.status,
      });
    }
    const draft = req.body?.draft;
    const version = Number(req.body?.version);
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
      return fail(res, 422, 'DRAFT_INVALID', 'Send an object of draft fields.');
    }
    if (!Number.isInteger(version)) return fail(res, 422, 'VERSION_REQUIRED', 'A version number is required.');
    if (version !== appRow.version) {
      return fail(res, 409, 'VERSION_CONFLICT', 'This application was updated in another tab. Reload to see the latest version.', {
        currentVersion: appRow.version,
        currentDraft: JSON.parse(appRow.draft),
      });
    }
    const merged = { ...JSON.parse(appRow.draft), ...draft };
    const now = nowIso();
    db.prepare('UPDATE applications SET draft = ?, version = version + 1, state = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(merged), String(merged.state ?? appRow.state), now, appRow.id);
    return res.json({ version: appRow.version + 1, updatedAt: now, draft: merged });
  });

  app.post('/api/applications/:id/submit', (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    if (appRow.status !== 'DRAFT') {
      return fail(res, 409, 'ALREADY_SUBMITTED', 'This application has already been submitted.', { status: appRow.status });
    }
    const service = SERVICE_BY_SLUG.get(appRow.service_slug);
    const draft = JSON.parse(appRow.draft);
    const fields = validateDraft(draft, { submit: true });
    const docs = db.prepare('SELECT kind FROM documents WHERE application_id = ?').all(appRow.id).map((d) => d.kind);
    for (const doc of service.documents ?? []) {
      if (doc.required && !docs.includes(doc.key)) fields[`document_${doc.key}`] = 'DOCUMENT_REQUIRED';
    }
    if (Object.keys(fields).length > 0) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Some details still need attention.',
          fields,
        },
      });
    }
    const now = nowIso();
    db.prepare("UPDATE applications SET status = 'AWAITING_PAYMENT', version = version + 1, updated_at = ? WHERE id = ?")
      .run(now, appRow.id);
    addEvent(db, appRow.id, 'SUBMITTED', 'Application submitted for payment', 'आवेदन भुगतान के लिए जमा हुआ', now);
    return res.json(serialiseApplication(db, appRow.id));
  });

  app.post('/api/applications/:id/documents', uploadLimit, (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    if (!['DRAFT', 'AWAITING_PAYMENT'].includes(appRow.status)) {
      return fail(res, 409, 'APPLICATION_LOCKED', 'Documents can no longer be changed for this application.', { status: appRow.status });
    }
    const service = SERVICE_BY_SLUG.get(appRow.service_slug);
    const kind = String(req.body?.kind ?? '');
    const docConfig = (service.documents ?? []).find((d) => d.key === kind);
    const result = validateDocument({
      kind,
      dataUrl: req.body?.dataUrl,
      docConfig,
    });
    if (result.code) {
      const messages = {
        DOCUMENT_KIND_INVALID: 'That document type is not part of this application.',
        DOCUMENT_DATA_INVALID: 'The selected file could not be read. Try again.',
        DOCUMENT_TYPE_INVALID: kind === 'photo' || kind === 'signature' ? 'Use a JPG or PNG for this document.' : 'Use a PDF, JPG or PNG.',
        DOCUMENT_TOO_LARGE: kind === 'photo' || kind === 'signature' ? 'This file is larger than 1 MB.' : 'This file is larger than 2 MB.',
        DOCUMENT_UNREADABLE: 'This file is not a valid image or PDF.',
        DOCUMENT_TYPE_MISMATCH: 'The file content does not match its file type.',
      };
      return fail(res, 422, result.code, messages[result.code] ?? 'The document could not be accepted.');
    }
    const ext = result.mime === 'application/pdf' ? 'pdf' : result.mime === 'image/png' ? 'png' : 'jpg';
    const filename = String(req.body?.filename ?? `${kind}.${ext}`).replace(/[^\w.\- ]/g, '').slice(0, 120) || `${kind}.${ext}`;
    const storedName = `${appRow.id}_${kind}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const absolute = path.join(uploadsDir, storedName);
    fs.writeFileSync(absolute, result.buffer);

    const existing = db
      .prepare('SELECT * FROM documents WHERE application_id = ? AND kind = ?')
      .get(appRow.id, kind);
    if (existing) {
      const oldPath = path.join(uploadsDir, path.basename(existing.stored_name));
      try { fs.unlinkSync(oldPath); } catch { /* the file may already be gone */ }
    }
    const docId = existing?.id ?? newId('doc');
    const now = nowIso();
    db.prepare(
      `INSERT INTO documents (id, application_id, kind, filename, mime, size, stored_name, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(application_id, kind) DO UPDATE SET
         filename = excluded.filename, mime = excluded.mime, size = excluded.size,
         stored_name = excluded.stored_name, uploaded_at = excluded.uploaded_at`,
    ).run(docId, appRow.id, kind, filename, result.mime, result.size, storedName, now);
    if (!existing) {
      addEvent(db, appRow.id, 'DOCUMENT_ADDED', `Document added: ${docConfig.label.en}`, `दस्तावेज़ जोड़ा गया: ${docConfig.label.hi}`, now);
    }
    return res.status(201).json({
      id: docId,
      kind,
      filename,
      mime: result.mime,
      size: result.size,
      uploadedAt: now,
      url: docUrl(appRow.id, docId),
    });
  });

  app.delete('/api/applications/:id/documents/:docId', (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    if (appRow.status !== 'DRAFT') {
      return fail(res, 409, 'APPLICATION_LOCKED', 'Documents can no longer be changed after submission.', { status: appRow.status });
    }
    const doc = db
      .prepare('SELECT * FROM documents WHERE id = ? AND application_id = ?')
      .get(req.params.docId, appRow.id);
    if (!doc) return fail(res, 404, 'DOCUMENT_NOT_FOUND', 'That document is not attached to this application.');
    db.prepare('DELETE FROM documents WHERE id = ?').run(doc.id);
    try { fs.unlinkSync(path.join(uploadsDir, path.basename(doc.stored_name))); } catch { /* ignore */ }
    return res.json({ ok: true });
  });

  app.get('/api/applications/:id/documents/:docId/file', (req, res) => {
    const doc = db
      .prepare('SELECT * FROM documents WHERE id = ? AND application_id = ?')
      .get(req.params.docId, req.params.id);
    if (!doc) return fail(res, 404, 'DOCUMENT_NOT_FOUND', 'That document is not attached to this application.');
    const absolute = path.join(uploadsDir, path.basename(doc.stored_name));
    if (!fs.existsSync(absolute)) return fail(res, 404, 'DOCUMENT_MISSING', 'The stored file is no longer available.');
    res.setHeader('Content-Type', doc.mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.filename)}"`);
    return res.sendFile(absolute);
  });

  app.post('/api/applications/:id/payment', paymentLimit, (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    const service = SERVICE_BY_SLUG.get(appRow.service_slug);
    const key = String(req.get('idempotency-key') ?? '').trim();
    if (key.length < 8 || key.length > 100) {
      return fail(res, 422, 'IDEMPOTENCY_KEY_REQUIRED', 'An Idempotency-Key header is required.');
    }

    const existing = db.prepare('SELECT * FROM payments WHERE idempotency_key = ?').get(key);
    if (existing) {
      if (existing.application_id !== appRow.id) {
        return fail(res, 409, 'IDEMPOTENCY_KEY_REUSED', 'That payment key belongs to a different application.');
      }
      return res.json({ payment: serialisePayment(existing, service), replay: true });
    }

    if (appRow.status === 'DRAFT') {
      return fail(res, 409, 'NOT_SUBMITTED', 'Submit the application before paying.');
    }
    if (appRow.status !== 'AWAITING_PAYMENT') {
      return fail(res, 409, 'ALREADY_PAID', 'This application has already been paid.', {
        payment: serialisePayment(
          db.prepare('SELECT * FROM payments WHERE application_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1')
            .get(appRow.id, 'SUCCESS'),
          service,
        ),
      });
    }
    if (!service.fee) return fail(res, 400, 'NO_FEE_DUE', 'There is no fee due for this application.');

    const fields = validatePayment(req.body);
    if (Object.keys(fields).length > 0) {
      return res.status(422).json({
        error: { code: 'VALIDATION_FAILED', message: 'Check your card details.', fields },
      });
    }

    const now = nowIso();
    const cardNumber = String(req.body.cardNumber).replace(/\s|-/g, '');
    const last4 = cardNumber.slice(-4);
    const forceFailure = req.body?.forceFailure === true || last4 === '0000';
    if (forceFailure) {
      const id = newId('pay');
      db.prepare(
        `INSERT INTO payments (id, application_id, idempotency_key, amount, status, receipt_no, card_last4, failure_code, created_at)
         VALUES (?, ?, ?, ?, 'FAILED', NULL, ?, 'GATEWAY_DECLINED', ?)`,
      ).run(id, appRow.id, key, service.fee, last4, now);
      addEvent(db, appRow.id, 'PAYMENT_FAILED', 'Payment was declined by the gateway', 'गेटवे ने भुगतान अस्वीकार किया', now);
      const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
      return res.status(402).json({
        error: {
          code: 'PAYMENT_DECLINED',
          message: 'The demo gateway declined this card. Try another card or retry.',
          payment: serialisePayment(payment, service),
        },
      });
    }

    const id = newId('pay');
    const receiptNo = `RCPT-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
    db.prepare(
      `INSERT INTO payments (id, application_id, idempotency_key, amount, status, receipt_no, card_last4, failure_code, created_at)
       VALUES (?, ?, ?, ?, 'SUCCESS', ?, ?, NULL, ?)`,
    ).run(id, appRow.id, key, service.fee, receiptNo, last4, now);
    db.prepare("UPDATE applications SET status = 'PAID', version = version + 1, updated_at = ? WHERE id = ?")
      .run(now, appRow.id);
    addEvent(
      db, appRow.id, 'PAID',
      `Fee paid — ₹${service.fee} (receipt ${receiptNo})`,
      `शुल्क भुगतान हुआ — ₹${service.fee} (रसीद ${receiptNo})`,
      now,
    );
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    return res.status(201).json({ payment: serialisePayment(payment, service), replay: false });
  });

  app.get('/api/applications/:id/payment/status', (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    const service = SERVICE_BY_SLUG.get(appRow.service_slug);
    const payment = db
      .prepare('SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(appRow.id);
    return res.json({
      applicationStatus: appRow.status,
      payment: serialisePayment(payment, service),
    });
  });

  app.post('/api/applications/:id/slot', (req, res) => {
    const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!appRow) return fail(res, 404, 'APPLICATION_NOT_FOUND', 'No application matches that link.');
    if (!['PAID', 'SLOT_BOOKED'].includes(appRow.status)) {
      return fail(res, 409, 'PAYMENT_REQUIRED', 'Pay the fee before booking a test slot.', { status: appRow.status });
    }
    const slotId = String(req.body?.slotId ?? '');
    try {
      db.exec('BEGIN IMMEDIATE');
      const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId);
      if (!slot) {
        db.exec('ROLLBACK');
        return fail(res, 404, 'SLOT_NOT_FOUND', 'That slot is not available.');
      }
      const existing = db.prepare('SELECT * FROM bookings WHERE application_id = ?').get(appRow.id);
      if (existing && existing.slot_id === slotId) {
        db.exec('COMMIT');
        return res.json(serialiseApplication(db, appRow.id));
      }
      if (slot.booked >= slot.capacity) {
        db.exec('ROLLBACK');
        return fail(res, 409, 'SLOT_FULL', 'That slot just filled up. Pick another time.', { available: 0 });
      }
      if (existing) {
        db.prepare('UPDATE slots SET booked = MAX(0, booked - 1) WHERE id = ?').run(existing.slot_id);
        db.prepare('UPDATE bookings SET slot_id = ?, created_at = ? WHERE id = ?').run(slotId, nowIso(), existing.id);
      } else {
        db.prepare('INSERT INTO bookings (id, application_id, slot_id, created_at) VALUES (?, ?, ?, ?)')
          .run(newId('bkg'), appRow.id, slotId, nowIso());
      }
      db.prepare('UPDATE slots SET booked = booked + 1 WHERE id = ?').run(slotId);
      db.prepare("UPDATE applications SET status = 'SLOT_BOOKED', version = version + 1, updated_at = ? WHERE id = ?")
        .run(nowIso(), appRow.id);
      db.exec('COMMIT');
      addEvent(
        db, appRow.id, 'SLOT_BOOKED',
        `Test slot booked for ${slot.date} at ${slot.time}`,
        `${slot.date} को ${slot.time} बजे टेस्ट स्लॉट बुक हुआ`,
      );
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
      throw error;
    }
    return res.json(serialiseApplication(db, appRow.id));
  });

  app.post('/api/demo/reset', (req, res) => {
    db.exec('DELETE FROM bookings; DELETE FROM payments; DELETE FROM documents; DELETE FROM events; DELETE FROM applications; UPDATE slots SET booked = 0;');
    for (const file of fs.readdirSync(uploadsDir)) {
      try { fs.unlinkSync(path.join(uploadsDir, file)); } catch { /* ignore */ }
    }
    res.json({ ok: true });
  });

  app.use('/api', (req, res) => fail(res, 404, 'NOT_FOUND', 'That API route does not exist.'));

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.too.large') {
      return fail(res, 413, 'PAYLOAD_TOO_LARGE', 'That upload is too large.');
    }
    if (error instanceof SyntaxError && 'body' in error) {
      return fail(res, 400, 'INVALID_JSON', 'The request body is not valid JSON.');
    }
    console.error('[api]', error);
    return fail(res, 500, 'INTERNAL', 'Something went wrong on our side. Try again.');
  });

  app.locals.db = db;
  app.locals.close = () => db.close();
  return app;
}
