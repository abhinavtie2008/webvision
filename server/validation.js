const VEHICLE_CLASSES = new Set(['LMV', 'MCWG', 'MCWOG']);
export const CATEGORIES = new Set(['general', 'diplomat', 'foreigner', 'oci', 'divyang', 'repatriate', 'refugee', 'exServicemen']);
export const HISTORY = new Set(['none', 'dl', 'll']);

export function luhnValid(number) {
  const digits = String(number).replace(/\s|-/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function ageOn(dob, today = new Date()) {
  const birth = new Date(`${dob}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const month = today.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

function isDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Field-level validation. Draft saves accept partial input; submit requires
 * everything, including the declaration and documents (checked by the caller).
 * Returns a map of field -> error code, or an empty object.
 */
export function validateDraft(draft, { submit = false } = {}) {
  const fields = {};
  const d = draft ?? {};
  const has = (value) => value !== undefined && value !== null && String(value).trim() !== '';

  if (!has(d.category) || !CATEGORIES.has(d.category)) {
    if (submit || has(d.category)) fields.category = 'CATEGORY_INVALID';
  }
  if (!has(d.licenceHistory) || !HISTORY.has(d.licenceHistory)) {
    if (submit || has(d.licenceHistory)) fields.licenceHistory = 'HISTORY_INVALID';
  }

  if (!has(d.fullName)) {
    if (submit) fields.fullName = 'FULL_NAME_REQUIRED';
  } else if (!/^[\p{L} .'-]{2,80}$/u.test(String(d.fullName).trim())) {
    fields.fullName = 'FULL_NAME_INVALID';
  }

  if (!has(d.dob)) {
    if (submit) fields.dob = 'DOB_REQUIRED';
  } else if (!isDateString(String(d.dob))) {
    fields.dob = 'DOB_INVALID';
  } else {
    const age = ageOn(String(d.dob));
    if (age < 16 || age > 100) {
      fields.dob = 'DOB_TOO_YOUNG';
    } else {
      const classes = Array.isArray(d.vehicleClass) ? d.vehicleClass : [];
      const needs18 = classes.some((c) => c !== 'MCWOG');
      if (needs18 && age < 18) fields.dob = 'DOB_TOO_YOUNG';
    }
  }

  if (!has(d.vehicleClass) || !Array.isArray(d.vehicleClass) || d.vehicleClass.length === 0) {
    if (submit || has(d.vehicleClass)) fields.vehicleClass = 'VEHICLE_CLASS_REQUIRED';
  } else if (d.vehicleClass.some((c) => !VEHICLE_CLASSES.has(c))) {
    fields.vehicleClass = 'VEHICLE_CLASS_INVALID';
  }

  if (!has(d.gender)) {
    if (submit) fields.gender = 'GENDER_REQUIRED';
  } else if (!['female', 'male', 'other'].includes(d.gender)) {
    fields.gender = 'GENDER_INVALID';
  }

  if (!has(d.mobile)) {
    if (submit) fields.mobile = 'MOBILE_REQUIRED';
  } else if (!/^[6-9]\d{9}$/.test(String(d.mobile).replace(/\s/g, ''))) {
    fields.mobile = 'MOBILE_INVALID';
  }

  if (has(d.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(d.email))) {
    fields.email = 'EMAIL_INVALID';
  }

  if (!has(d.addressLine)) {
    if (submit) fields.addressLine = 'ADDRESS_REQUIRED';
  } else if (String(d.addressLine).trim().length < 5) {
    fields.addressLine = 'ADDRESS_TOO_SHORT';
  }

  if (!has(d.city)) {
    if (submit) fields.city = 'CITY_REQUIRED';
  }

  if (!has(d.state)) {
    if (submit) fields.state = 'STATE_REQUIRED';
  }

  if (!has(d.pincode)) {
    if (submit) fields.pincode = 'PINCODE_REQUIRED';
  } else if (!/^\d{6}$/.test(String(d.pincode))) {
    fields.pincode = 'PINCODE_INVALID';
  }

  if (submit && d.declaration !== true) {
    fields.declaration = 'DECLARATION_REQUIRED';
  }

  return fields;
}

export function validatePayment(body) {
  const fields = {};
  const cardNumber = String(body?.cardNumber ?? '').replace(/\s|-/g, '');
  if (!luhnValid(cardNumber)) fields.cardNumber = 'CARD_INVALID';
  if (!/^[A-Za-z .'-]{2,60}$/.test(String(body?.cardName ?? '').trim())) fields.cardName = 'CARD_NAME_INVALID';
  const expiry = String(body?.expiry ?? '');
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    fields.expiry = 'EXPIRY_INVALID';
  } else {
    const [mm, yy] = expiry.split('/').map(Number);
    const expiryDate = new Date(2000 + yy, mm, 1);
    if (expiryDate <= new Date()) fields.expiry = 'EXPIRY_PAST';
  }
  if (!/^\d{3,4}$/.test(String(body?.cvv ?? ''))) fields.cvv = 'CVV_INVALID';
  return fields;
}

const MAGIC = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];

export function sniffFile(buffer) {
  for (const sig of MAGIC) {
    if (sig.bytes.every((b, i) => buffer[i] === b)) return sig.mime;
  }
  return null;
}

export function validateDocument({ kind, dataUrl, docConfig }) {
  if (!docConfig) return { code: 'DOCUMENT_KIND_INVALID' };
  const match = /^data:([a-z0-9.+/-]+);base64,(.+)$/i.exec(String(dataUrl ?? ''));
  if (!match) return { code: 'DOCUMENT_DATA_INVALID' };
  const declared = match[1].toLowerCase();
  const allowed = kind === 'photo' || kind === 'signature' ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowed.includes(declared)) return { code: 'DOCUMENT_TYPE_INVALID' };
  const buffer = Buffer.from(match[2], 'base64');
  const limit = kind === 'photo' || kind === 'signature' ? 1024 * 1024 : 2 * 1024 * 1024;
  if (buffer.length === 0) return { code: 'DOCUMENT_DATA_INVALID' };
  if (buffer.length > limit) return { code: 'DOCUMENT_TOO_LARGE' };
  const sniffed = sniffFile(buffer);
  if (!sniffed) return { code: 'DOCUMENT_UNREADABLE' };
  if (sniffed !== declared) return { code: 'DOCUMENT_TYPE_MISMATCH' };
  return { buffer, mime: sniffed, size: buffer.length };
}
