import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createApp } from '../app.js';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarathi-api-'));
const app = createApp({
  dbFile: path.join(tempDir, 'test.db'),
  uploadsDir: path.join(tempDir, 'uploads'),
});
let server;
let base;
const db = app.locals.db;

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  app.locals.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function api(url, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(base + url, {
    method,
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await response.json(); } catch { /* empty body */ }
  return { status: response.status, json };
}

const VALID_DRAFT = {
  category: 'general',
  licenceHistory: 'none',
  vehicleClass: ['LMV'],
  fullName: 'Asha Verma',
  dob: '1995-04-12',
  gender: 'female',
  mobile: '9812345678',
  email: 'asha@example.com',
  addressLine: '12 Janpath Road',
  city: 'New Delhi',
  state: 'DL',
  pincode: '110001',
  declaration: true,
};

async function createDraft(state = 'DL') {
  const { status, json } = await api('/api/applications', {
    method: 'POST',
    body: { serviceSlug: 'learner-licence', state },
  });
  assert.equal(status, 201);
  return json;
}

async function uploadAllDocs(applicationId) {
  for (const kind of ['ageProof', 'addressProof', 'photo', 'signature']) {
    const { status } = await api(`/api/applications/${applicationId}/documents`, {
      method: 'POST',
      body: { kind, filename: `${kind}.png`, dataUrl: PNG_1PX },
    });
    assert.equal(status, 201, `upload ${kind}`);
  }
}

async function createSubmittedApp(draftOverrides = {}) {
  const created = await createDraft();
  const draft = { ...VALID_DRAFT, ...draftOverrides };
  const saved = await api(`/api/applications/${created.id}/draft`, {
    method: 'PATCH',
    body: { draft, version: created.version },
  });
  assert.equal(saved.status, 200);
  await uploadAllDocs(created.id);
  const submitted = await api(`/api/applications/${created.id}/submit`, { method: 'POST' });
  assert.equal(submitted.status, 200);
  return submitted.json;
}

test('catalogue exposes bilingual services and the learner flow', async () => {
  const { status, json } = await api('/api/services');
  assert.equal(status, 200);
  assert.ok(json.services.length >= 15);
  const learner = json.services.find((s) => s.slug === 'learner-licence');
  assert.equal(learner.applyFlow, true);
  assert.ok(learner.title.en && learner.title.hi);
  assert.equal(learner.documents.length, 4);
});

test('unknown deep links return JSON 404s, not HTML', async () => {
  const { status, json } = await api('/api/nope');
  assert.equal(status, 404);
  assert.equal(json.error.code, 'NOT_FOUND');
});

test('creates a draft application with a reference and first timeline event', async () => {
  const created = await createDraft();
  assert.match(created.reference, /^DL-\d{4}-[A-Z2-9]{6}$/);
  assert.equal(created.status, 'DRAFT');
  assert.equal(created.version, 1);
  assert.equal(created.events.length, 1);
  assert.equal(created.events[0].type, 'STARTED');
  assert.equal(created.service.slug, 'learner-licence');
});

test('autosave increments the version and rejects stale writes', async () => {
  const created = await createDraft();
  const first = await api(`/api/applications/${created.id}/draft`, {
    method: 'PATCH',
    body: { draft: { fullName: 'Asha Verma' }, version: 1 },
  });
  assert.equal(first.status, 200);
  assert.equal(first.json.version, 2);
  assert.equal(first.json.draft.fullName, 'Asha Verma');

  const stale = await api(`/api/applications/${created.id}/draft`, {
    method: 'PATCH',
    body: { draft: { fullName: 'Someone Else' }, version: 1 },
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.error.code, 'VERSION_CONFLICT');
  assert.equal(stale.json.error.currentVersion, 2);
});

test('submission reports field errors and missing documents together', async () => {
  const created = await createDraft();
  const { status, json } = await api(`/api/applications/${created.id}/submit`, { method: 'POST' });
  assert.equal(status, 422);
  assert.equal(json.error.code, 'VALIDATION_FAILED');
  assert.equal(json.error.fields.fullName, 'FULL_NAME_REQUIRED');
  assert.equal(json.error.fields.document_ageProof, 'DOCUMENT_REQUIRED');
  assert.equal(json.error.fields.declaration, 'DECLARATION_REQUIRED');
});

test('under-18 applicants are blocked for a car licence but not for MCWOG', async () => {
  const created = await createDraft();
  const car = await api(`/api/applications/${created.id}/draft`, {
    method: 'PATCH',
    body: { draft: { ...VALID_DRAFT, dob: '2010-01-01', vehicleClass: ['LMV'] }, version: 1 },
  });
  assert.equal(car.status, 200);
  let result = await api(`/api/applications/${created.id}/submit`, { method: 'POST' });
  assert.equal(result.json.error.fields.dob, 'DOB_TOO_YOUNG');

  const scooter = await api(`/api/applications/${created.id}/draft`, {
    method: 'PATCH',
    body: { draft: { vehicleClass: ['MCWOG'] }, version: 2 },
  });
  assert.equal(scooter.status, 200);
  result = await api(`/api/applications/${created.id}/submit`, { method: 'POST' });
  assert.equal(result.status, 422);
  assert.equal(result.json.error.fields.dob, undefined);
});

test('rejects spoofed files and accepts validated uploads', async () => {
  const created = await createDraft();
  const bad = await api(`/api/applications/${created.id}/documents`, {
    method: 'POST',
    body: { kind: 'photo', filename: 'photo.png', dataUrl: 'data:image/png;base64,aGVsbG8=' },
  });
  assert.equal(bad.status, 422);
  assert.equal(bad.json.error.code, 'DOCUMENT_UNREADABLE');

  const wrongType = await api(`/api/applications/${created.id}/documents`, {
    method: 'POST',
    body: { kind: 'photo', filename: 'photo.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0=' },
  });
  assert.equal(wrongType.status, 422);
  assert.equal(wrongType.json.error.code, 'DOCUMENT_TYPE_INVALID');

  const good = await api(`/api/applications/${created.id}/documents`, {
    method: 'POST',
    body: { kind: 'photo', filename: 'photo.png', dataUrl: PNG_1PX },
  });
  assert.equal(good.status, 201);
  assert.equal(good.json.mime, 'image/png');
});

test('submits a complete application and locks further edits', async () => {
  const app = await createSubmittedApp();
  assert.equal(app.status, 'AWAITING_PAYMENT');
  assert.ok(app.events.some((e) => e.type === 'SUBMITTED'));

  const locked = await api(`/api/applications/${app.id}/draft`, {
    method: 'PATCH',
    body: { draft: { fullName: 'Changed' }, version: app.version },
  });
  assert.equal(locked.status, 409);
  assert.equal(locked.json.error.code, 'APPLICATION_LOCKED');
});

test('payment amount comes from the server and is idempotent', async () => {
  const app = await createSubmittedApp();
  const key = crypto.randomUUID();
  const payload = {
    cardNumber: '4242 4242 4242 4242',
    cardName: 'ASHA VERMA',
    expiry: '12/30',
    cvv: '123',
    amount: 1,
  };
  const first = await api(`/api/applications/${app.id}/payment`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: payload,
  });
  assert.equal(first.status, 201);
  assert.equal(first.json.payment.amount, 500);
  assert.equal(first.json.payment.status, 'SUCCESS');
  assert.match(first.json.payment.receiptNo, /^RCPT-/);

  const replay = await api(`/api/applications/${app.id}/payment`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: payload,
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.json.replay, true);
  assert.equal(replay.json.payment.receiptNo, first.json.payment.receiptNo);

  const rows = db.prepare('SELECT COUNT(*) AS n FROM payments WHERE application_id = ?').get(app.id);
  assert.equal(rows.n, 1);
});

test('declined payments keep the same idempotent response', async () => {
  const app = await createSubmittedApp();
  const key = crypto.randomUUID();
  const body = {
    cardNumber: '4000 0000 0000 0002',
    cardName: 'ASHA VERMA',
    expiry: '12/30',
    cvv: '123',
    forceFailure: true,
  };
  const declined = await api(`/api/applications/${app.id}/payment`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body,
  });
  assert.equal(declined.status, 402);
  assert.equal(declined.json.error.code, 'PAYMENT_DECLINED');
  assert.equal(declined.json.error.payment.status, 'FAILED');

  const replay = await api(`/api/applications/${app.id}/payment`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body,
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.json.replay, true);
  assert.equal(replay.json.payment.status, 'FAILED');
});

test('a payment key cannot be reused for another application', async () => {
  const one = await createSubmittedApp();
  const two = await createSubmittedApp();
  const key = crypto.randomUUID();
  const body = { cardNumber: '4242 4242 4242 4242', cardName: 'ASHA VERMA', expiry: '12/30', cvv: '123' };
  const first = await api(`/api/applications/${one.id}/payment`, { method: 'POST', headers: { 'Idempotency-Key': key }, body });
  assert.equal(first.status, 201);
  const other = await api(`/api/applications/${two.id}/payment`, { method: 'POST', headers: { 'Idempotency-Key': key }, body });
  assert.equal(other.status, 409);
  assert.equal(other.json.error.code, 'IDEMPOTENCY_KEY_REUSED');
});

test('slot booking is atomic, idempotent, and rejects full slots', async () => {
  const app = await createSubmittedApp();
  const key = crypto.randomUUID();
  await api(`/api/applications/${app.id}/payment`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: { cardNumber: '4242 4242 4242 4242', cardName: 'ASHA VERMA', expiry: '12/30', cvv: '123' },
  });
  const slots = await api('/api/slots');
  assert.equal(slots.status, 200);
  const slot = slots.json.slots.find((s) => s.available > 0);
  assert.ok(slot);

  const booked = await api(`/api/applications/${app.id}/slot`, { method: 'POST', body: { slotId: slot.id } });
  assert.equal(booked.status, 200);
  assert.equal(booked.json.status, 'SLOT_BOOKED');
  assert.equal(booked.json.booking.time, slot.time);

  const again = await api(`/api/applications/${app.id}/slot`, { method: 'POST', body: { slotId: slot.id } });
  assert.equal(again.status, 200);
  assert.equal(again.json.booking.id, booked.json.booking.id);

  // Force the chosen slot to be full, then try booking it from another paid application.
  const other = await createSubmittedApp();
  await api(`/api/applications/${other.id}/payment`, {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: { cardNumber: '4242 4242 4242 4242', cardName: 'ASHA VERMA', expiry: '12/30', cvv: '123' },
  });
  db.prepare('UPDATE slots SET capacity = booked WHERE id = ?').run(slot.id);
  const full = await api(`/api/applications/${other.id}/slot`, { method: 'POST', body: { slotId: slot.id } });
  assert.equal(full.status, 409);
  assert.equal(full.json.error.code, 'SLOT_FULL');
});

test('OTP lookup resumes an application and masks the mobile number', async () => {
  const app = await createSubmittedApp();
  const lookup = await api('/api/applications/lookup', { method: 'POST', body: { reference: app.reference } });
  assert.equal(lookup.status, 200);
  assert.equal(lookup.json.maskedMobile, '••••••5678');
  assert.equal(lookup.json.demoOtp, '123456');

  const wrong = await api('/api/applications/lookup/verify', {
    method: 'POST',
    body: { challengeId: lookup.json.challengeId, otp: '000000' },
  });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.json.error.attemptsLeft, 4);

  const ok = await api('/api/applications/lookup/verify', {
    method: 'POST',
    body: { challengeId: lookup.json.challengeId, otp: '123456' },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.applicationId, app.id);
});

test('public status view masks the mobile number', async () => {
  const app = await createSubmittedApp();
  const view = await api(`/api/applications/by-ref/${app.reference}`);
  assert.equal(view.status, 200);
  assert.equal(view.json.draft.mobile, '••••••5678');
  assert.equal(view.json.reference, app.reference);
});

test('reset clears applications but keeps the catalogue', async () => {
  const { status } = await api('/api/demo/reset', { method: 'POST' });
  assert.equal(status, 200);
  const apps = db.prepare('SELECT COUNT(*) AS n FROM applications').get();
  assert.equal(apps.n, 0);
  const services = await api('/api/services');
  assert.ok(services.json.services.length >= 15);
});
