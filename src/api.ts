import type {
  Application,
  ApiErrorBody,
  Draft,
  Meta,
  Payment,
  Service,
  SlotsResponse,
} from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  details: ApiErrorBody['error'] | null;

  constructor(status: number, body: ApiErrorBody | null, fallback = 'Something went wrong.') {
    super(body?.error?.message ?? fallback);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error?.code ?? 'UNKNOWN';
    this.fields = body?.error?.fields;
    this.details = body?.error ?? null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, parsed as ApiErrorBody | null);
  }
  return parsed as T;
}

export const api = {
  meta: () => request<Meta>('/api/meta'),

  services: () => request<{ services: Service[] }>('/api/services'),

  service: (slug: string) => request<{ service: Service }>(`/api/services/${encodeURIComponent(slug)}`),

  slots: (centreId?: string) => {
    const query = centreId ? `?centreId=${encodeURIComponent(centreId)}` : '';
    return request<SlotsResponse>(`/api/slots${query}`);
  },

  createApplication: (serviceSlug: string, state: string) =>
    request<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ serviceSlug, state }),
    }),

  application: (id: string) => request<Application>(`/api/applications/${encodeURIComponent(id)}`),

  applicationByReference: (reference: string) =>
    request<Application>(`/api/applications/by-ref/${encodeURIComponent(reference.trim().toUpperCase())}`),

  saveDraft: (id: string, draft: Draft, version: number) =>
    request<{ version: number; updatedAt: string; draft: Draft }>(
      `/api/applications/${encodeURIComponent(id)}/draft`,
      { method: 'PATCH', body: JSON.stringify({ draft, version }) },
    ),

  submit: (id: string) =>
    request<Application>(`/api/applications/${encodeURIComponent(id)}/submit`, { method: 'POST' }),

  uploadDocument: (id: string, kind: string, filename: string, dataUrl: string) =>
    request<{
      id: string;
      kind: string;
      filename: string;
      mime: string;
      size: number;
      uploadedAt: string;
      url: string;
    }>(`/api/applications/${encodeURIComponent(id)}/documents`, {
      method: 'POST',
      body: JSON.stringify({ kind, filename, dataUrl }),
    }),

  deleteDocument: (id: string, docId: string) =>
    request<{ ok: boolean }>(`/api/applications/${encodeURIComponent(id)}/documents/${docId}`, {
      method: 'DELETE',
    }),

  pay: (
    id: string,
    idempotencyKey: string,
    card: { cardNumber: string; cardName: string; expiry: string; cvv: string; forceFailure?: boolean },
  ) =>
    request<{ payment: Payment; replay: boolean }>(`/api/applications/${encodeURIComponent(id)}/payment`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(card),
    }),

  bookSlot: (id: string, slotId: string) =>
    request<Application>(`/api/applications/${encodeURIComponent(id)}/slot`, {
      method: 'POST',
      body: JSON.stringify({ slotId }),
    }),

  lookup: (reference: string) =>
    request<{ challengeId: string; maskedMobile: string; demoOtp: string; expiresInSeconds: number }>(
      '/api/applications/lookup',
      { method: 'POST', body: JSON.stringify({ reference }) },
    ),

  verifyOtp: (challengeId: string, otp: string) =>
    request<{ applicationId: string }>('/api/applications/lookup/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp }),
    }),

  resetDemo: () => request<{ ok: boolean }>('/api/demo/reset', { method: 'POST' }),
};
