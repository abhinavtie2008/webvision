import type { Lang } from './types';

const locale = (lang: Lang) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

export function formatDate(value: string | Date, lang: Lang): string {
  const date = typeof value === 'string' ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value: string, lang: Lang): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDay(value: string, lang: Lang): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale(lang), { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

export function formatWeekday(value: string, lang: Lang): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale(lang), { weekday: 'short' }).format(date);
}

export function formatDayNumber(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : String(date.getDate());
}

export function formatMonth(value: string, lang: Lang): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale(lang), { month: 'short' }).format(date);
}

export function formatCurrency(amount: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang), {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeAgo(value: string, lang: Lang): string {
  const date = new Date(value);
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  if (seconds < 60) return formatter.format(-seconds, 'second');
  if (seconds < 3600) return formatter.format(-Math.round(seconds / 60), 'minute');
  if (seconds < 86400) return formatter.format(-Math.round(seconds / 3600), 'hour');
  return formatter.format(-Math.round(seconds / 86400), 'day');
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function luhnValid(value: string): boolean {
  const digits = value.replace(/\s|-/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function ageFromDob(dob: string): number {
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function titleForService(slug: string): string {
  return slug;
}
