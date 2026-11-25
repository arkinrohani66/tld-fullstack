import { getSupabaseClient } from './supabaseClient';

export interface WaybillLookupResult {
  waybillCode: string;
  originCity: string;
  destinationCity: string;
  shipperName: string | null;
  weightTons: number | null;
  status: 'ISSUED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

export const waybillService = {
  async lookupWaybill(code: string): Promise<WaybillLookupResult | null> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured');

    const { data, error } = await client.functions.invoke('lookup-waybill', { body: { code } });
    if (error) {
      const response = (error as { context?: Response }).context;
      let errorCode = 'REQUEST_FAILED';
      try {
        const body = await response?.json();
        if (typeof body?.error === 'string') errorCode = body.error;
      } catch {
        // response body is not JSON; keep the generic code
      }
      throw new Error(errorCode);
    }
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return null;

    return {
      waybillCode: row.waybill_code,
      originCity: row.origin_city,
      destinationCity: row.destination_city,
      shipperName: row.shipper_name ?? null,
      weightTons: row.weight_tons === null ? null : Number(row.weight_tons),
      status: row.status,
    };
  },
};
