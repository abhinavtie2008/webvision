export type Lang = 'en' | 'hi';
export type Localised = { en: string; hi: string };

export interface Category {
  id: string;
  label: Localised;
}

export interface DocConfig {
  key: string;
  required: boolean;
  label: Localised;
  hint: Localised;
}

export interface Service {
  slug: string;
  category: string;
  popular?: boolean;
  applyFlow?: boolean;
  title: Localised;
  summary: Localised;
  description: Localised;
  fee: number;
  feeNote: Localised;
  minutes: number;
  mode: string[];
  tags: string[];
  documents: DocConfig[];
  eligibility: Localised[];
  steps: Localised[];
}

export interface Centre {
  id: string;
  name: Localised;
  address: Localised;
  district: string;
}

export interface Meta {
  categories: Category[];
  states: { code: string; name: string }[];
  centres: Centre[];
  demo: boolean;
}

export interface Draft {
  state?: string;
  category?: string;
  licenceHistory?: string;
  vehicleClass?: string[];
  fullName?: string;
  dob?: string;
  gender?: string;
  mobile?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  pincode?: string;
  declaration?: boolean;
}

export interface DocumentItem {
  id: string;
  kind: string;
  filename: string;
  mime: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface TimelineEvent {
  id: number;
  type: string;
  message: Localised;
  at: string;
}

export interface Payment {
  id: string;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  currency: string;
  receiptNo: string | null;
  cardLast4: string | null;
  failureCode: string | null;
  createdAt: string;
  breakdown: { label: Localised; amount: number }[];
}

export interface Booking {
  id: string;
  slotId: string;
  date: string;
  time: string;
  centre: { id: string; name: Localised; address: Localised };
  createdAt: string;
}

export type AppStatus = 'DRAFT' | 'AWAITING_PAYMENT' | 'PAID' | 'SLOT_BOOKED';

export interface Application {
  id: string;
  reference: string;
  status: AppStatus;
  state: string;
  draft: Draft;
  version: number;
  createdAt: string;
  updatedAt: string;
  service: Service;
  documents: DocumentItem[];
  events: TimelineEvent[];
  payment: Payment | null;
  booking: Booking | null;
}

export interface Slot {
  id: string;
  centreId: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  available: number;
}

export interface SlotsResponse {
  centres: Centre[];
  slots: Slot[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    currentVersion?: number;
    currentDraft?: Draft;
    status?: string;
    payment?: Payment | null;
    available?: number;
    attemptsLeft?: number;
  };
}
