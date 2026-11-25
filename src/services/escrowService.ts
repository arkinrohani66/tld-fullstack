import { getSupabaseClient } from './supabaseClient';

export interface EscrowHoldResult {
  escrowId: string;
  deliveryOtp: string;
  totalHoldAmountTomans: number;
}

export type DeliverySettlementResult =
  | {
      status: 'RELEASED';
      driverCreditTomans: number;
      platformCommissionTomans: number;
      platformVatTomans: number;
    }
  | { status: 'INVALID_OTP'; attemptsLeft: number }
  | { status: 'OTP_LOCKED' }
  | { status: 'NOT_FOUND' };

export interface EscrowStatusSnapshot {
  escrowId: string;
  cargoId: string;
  shipperId: string;
  driverId: string;
  freightAmountTomans: number;
  commissionAmountTomans: number;
  vatAmountTomans: number;
  totalHoldAmountTomans: number;
  status: 'HELD_SECURE' | 'RELEASED_TO_DRIVER';
  createdAt: string;
  releasedAt: string | null;
}

const requireClient = () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client is not configured');
  return client;
};

const readFunctionErrorCode = async (error: unknown): Promise<string> => {
  const response = (error as { context?: Response }).context;
  try {
    const body = await response?.json();
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // response body is not JSON; fall through to the generic code
  }
  return 'REQUEST_FAILED';
};

export const escrowService = {
  async createEscrowHold(cargoId: string, driverId: string, freightAmountTomans: number): Promise<EscrowHoldResult> {
    const client = requireClient();
    const { data, error } = await client.functions.invoke('create-escrow-hold', {
      body: { cargoId, driverId, freightAmountTomans },
    });
    if (error) throw new Error(await readFunctionErrorCode(error));
    if (!data || typeof data.escrow_id !== 'string' || typeof data.delivery_otp !== 'string') {
      throw new Error('Unexpected escrow response');
    }
    return {
      escrowId: data.escrow_id,
      deliveryOtp: data.delivery_otp,
      totalHoldAmountTomans: Number(data.total_hold_amount_tomans),
    };
  },

  async acceptDriverBid(cargoId: string, bidId: string): Promise<{ cargoId: string; driverId: string; agreedFareTomans: number; tripId: string }> {
    const client = requireClient();
    const { data, error } = await client.functions.invoke('accept-driver-bid', {
      body: { cargoId, bidId },
    });
    if (error) throw new Error(await readFunctionErrorCode(error));
    if (!data || typeof data.cargo_id !== 'string') {
      throw new Error('Unexpected accept bid response');
    }
    return {
      cargoId: data.cargo_id,
      driverId: data.driver_id,
      agreedFareTomans: Number(data.agreed_fare_tomans),
      tripId: typeof data.trip_id === 'string' ? data.trip_id : '',
    };
  },

  /** راننده پیشنهاد متقابل صاحب بار را می‌پذیرد (از طریق تابع سرور). */
  async acceptCounterOffer(bidId: string): Promise<{
    cargoId: string;
    driverId: string;
    agreedFareTomans: number;
    tripId: string;
  }> {
    const client = requireClient();
    const { data, error } = await client.functions.invoke('accept-counter-offer', {
      body: { bidId },
    });
    if (error) throw new Error(await readFunctionErrorCode(error));
    if (!data || typeof data.cargo_id !== 'string') {
      throw new Error('Unexpected accept counter offer response');
    }
    return {
      cargoId: data.cargo_id,
      driverId: data.driver_id,
      agreedFareTomans: Number(data.agreed_fare_tomans),
      tripId: typeof data.trip_id === 'string' ? data.trip_id : '',
    };
  },

  /**
   * Reads the escrow state of a cargo the current user participates in (shipper or driver).
   * Returns null when no escrow hold exists yet. The delivery OTP is never returned by RLS.
   */
  async getEscrowByCargo(cargoId: string): Promise<EscrowStatusSnapshot | null> {
    const client = requireClient();
    const { data, error } = await client
      .from('escrow_accounts')
      .select('id, cargo_id, shipper_id, driver_id, freight_amount_tomans, commission_amount_tomans, vat_amount_tomans, total_hold_amount_tomans, status, created_at, released_at')
      .eq('cargo_id', cargoId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const row = data[0];
    return {
      escrowId: row.id,
      cargoId: row.cargo_id,
      shipperId: row.shipper_id,
      driverId: row.driver_id,
      freightAmountTomans: Number(row.freight_amount_tomans),
      commissionAmountTomans: Number(row.commission_amount_tomans),
      vatAmountTomans: Number(row.vat_amount_tomans),
      totalHoldAmountTomans: Number(row.total_hold_amount_tomans),
      status: row.status,
      createdAt: row.created_at,
      releasedAt: row.released_at ?? null,
    };
  },

  /** کد تحویل را فقط برای صاحب‌بار و از سرور می‌خواند (بدون ذخیره در localStorage). */
  async getDeliveryOtp(cargoId: string): Promise<string | null> {
    const client = requireClient();
    const { data, error } = await client.rpc('get_delivery_otp', { p_cargo_id: cargoId });
    if (error) return null;
    if (data?.status === 'OK' && typeof data.delivery_otp === 'string') {
      return data.delivery_otp;
    }
    return null;
  },

  async confirmDeliveryAndSettle(cargoId: string, otp: string): Promise<DeliverySettlementResult> {
    const client = requireClient();
    const { data, error } = await client.functions.invoke('confirm-delivery-and-settle', {
      body: { cargoId, otp },
    });
    if (error) throw new Error(await readFunctionErrorCode(error));

    switch (data?.status) {
      case 'RELEASED':
        return {
          status: 'RELEASED',
          driverCreditTomans: Number(data.driver_credit_tomans),
          platformCommissionTomans: Number(data.platform_commission_tomans),
          platformVatTomans: Number(data.platform_vat_tomans),
        };
      case 'INVALID_OTP':
        return { status: 'INVALID_OTP', attemptsLeft: Number(data.attempts_left) };
      case 'OTP_LOCKED':
        return { status: 'OTP_LOCKED' };
      case 'NOT_FOUND':
        return { status: 'NOT_FOUND' };
      default:
        throw new Error('Unexpected settlement response');
    }
  },
};
