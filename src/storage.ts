const KEY = 'sarathi.recent';
const MAX = 5;

export interface RecentApplication {
  id: string;
  reference: string;
  serviceSlug: string;
  updatedAt: string;
}

export function loadRecent(): RecentApplication[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentApplication[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.reference === 'string');
  } catch {
    return [];
  }
}

export function rememberApplication(entry: RecentApplication): void {
  try {
    const list = loadRecent().filter((item) => item.id !== entry.id);
    list.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // Storage can be blocked; the application is still reachable by reference.
  }
}

export function forgetApplication(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadRecent().filter((item) => item.id !== id)));
  } catch {
    // Ignore storage failures.
  }
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function latestApplication(): RecentApplication | null {
  return loadRecent()[0] ?? null;
}
