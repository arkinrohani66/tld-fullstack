/**
 * قراردادهای مشترک بین بک‌اند و فرانت‌اند.
 * هر نوع یا ثابت جدید را اینجا اضافه کنید تا هر دو سمت یک نسخه داشته باشند.
 */

export type Role = 'shipper' | 'driver' | 'admin';

/** کارمزد قطعی سامانه از هر کرایه (۵ درصد) */
export const COMMISSION_RATE = 0.05;
/** مالیات بر ارزش افزوده روی کارمزد سامانه (۹ درصد) */
export const VAT_RATE = 0.09;

export const CARGO_STATUSES = [
  'listed',
  'assigned',
  'funded',
  'in_transit',
  'delivered',
  'released',
  'cancelled',
] as const;

export type CargoStatus = (typeof CARGO_STATUSES)[number];

export const CARGO_STATUS_LABELS: Record<CargoStatus, string> = {
  listed: 'اعلام شده',
  assigned: 'راننده تعیین شده',
  funded: 'واریز به امانی',
  in_transit: 'در مسیر',
  delivered: 'تحویل شده',
  released: 'تسویه شده',
  cancelled: 'لغو شده',
};

export interface User {
  id: number;
  phone: string;
  fullName: string;
  role: Role;
}

export interface Cargo {
  id: number;
  ownerId: number;
  title: string;
  originCity: string;
  destinationCity: string;
  weightTon: number;
  priceIrr: string;
  status: CargoStatus;
  driverId: number | null;
  createdAt: string;
}

export interface Bid {
  id: number;
  cargoId: number;
  driverId: number;
  amountIrr: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface LedgerEntry {
  id: number;
  cargoId: number;
  kind: 'hold' | 'release_to_driver' | 'commission' | 'vat';
  amountIrr: string;
  createdAt: string;
}

export interface TelemetrySample {
  id: number;
  cargoId: number;
  fuelLevelPct: number | null;
  tempZone1C: number | null;
  tempZone2C: number | null;
  tempZone3C: number | null;
  shockG: number | null;
  lat: number | null;
  lng: number | null;
  recordedAt: string;
}
