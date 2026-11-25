import { CargoBidItem, BidStatus } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { mockDriverBids } from './mockDataProvider';
import { escrowService } from './escrowService';

const toman = (amount: number): string => `${amount.toLocaleString('fa-IR')} تومان`;

// توجه: پروفایل راننده از طریق ویو امن `profiles_public` خوانده می‌شود، چون RLS
// جدول `profiles` اجازه دیدن نام سایر کاربران را نمی‌دهد و embed قبلی همیشه null بود.
const BID_SELECT = `
  *,
  cargos (title, origin_city, destination_city, weight_tons, truck_type, agreed_fare_tomans, status),
  drivers (rating, total_trips, on_time_rate, plate_number, truck_model, fleet_type)
`;

const mapDbBid = (b: any): CargoBidItem => ({
  id: b.id,
  cargoId: b.cargo_id,
  cargoTitle: b.cargos?.title || 'محموله باربری',
  originCity: b.cargos?.origin_city || 'مبدا',
  destinationCity: b.cargos?.destination_city || 'مقصد',
  originalPrice: b.cargos?.agreed_fare_tomans
    ? toman(Number(b.cargos.agreed_fare_tomans))
    : 'توافقی',
  proposedFareAmount: Number(b.proposed_fare_tomans) || 0,
  proposedFareFormatted: toman(Number(b.proposed_fare_tomans) || 0),
  readyToLoadTime: b.ready_to_load_time || 'به محض بارگیری',
  driverNotes: b.driver_notes,
  status: b.status as BidStatus,
  counterOfferAmount: b.counter_offer_tomans ? Number(b.counter_offer_tomans) : undefined,
  counterOfferFormatted: b.counter_offer_tomans ? toman(Number(b.counter_offer_tomans)) : undefined,
  counterOfferNote: b.counter_offer_note || undefined,
  submittedAt: b.created_at
    ? new Date(b.created_at).toLocaleDateString('fa-IR')
    : 'امروز',
  expiresAt: '۴ ساعت دیگر',
  shipperName: 'صاحب‌بار سامانه TLD',
  shipperRating: 4.8,
  cargoWeight: b.cargos?.weight_tons ? `${Number(b.cargos.weight_tons).toLocaleString('fa-IR')} تن` : 'نامشخص',
  truckTypeRequired: b.cargos?.truck_type || 'تریلی کفی',
  driverFullName: b.__identity?.full_name || undefined,
  driverAvatarUrl: b.__identity?.avatar_url || undefined,
  driverRatingScore: b.drivers?.rating != null ? Number(b.drivers.rating) : undefined,
  driverTotalTrips: b.drivers?.total_trips != null ? Number(b.drivers.total_trips) : undefined,
  driverOnTimeRate: b.drivers?.on_time_rate != null ? Number(b.drivers.on_time_rate) : undefined,
  driverPlateNumber: b.drivers?.plate_number || undefined,
  driverTruckModel: b.drivers?.truck_model || undefined,
  driverFleetType: b.drivers?.fleet_type || undefined,
});

/** نام و تصویر راننده‌ها را از ویو عمومی (بدون دسترسی به داده حساس) تکمیل می‌کند. */
const attachDriverIdentity = async (
  client: ReturnType<typeof getSupabaseClient>,
  rows: any[]
): Promise<any[]> => {
  if (!client || rows.length === 0) return rows;
  const ids = Array.from(
    new Set(rows.map((r) => r.driver_id).filter((id: unknown): id is string => typeof id === 'string'))
  );
  if (ids.length === 0) return rows;

  try {
    const { data } = await client
      .from('profiles_public')
      .select('user_id, full_name, avatar_url')
      .in('user_id', ids);
    const byId = new Map((data || []).map((p: any) => [p.user_id, p]));
    return rows.map((r) => ({ ...r, __identity: byId.get(r.driver_id) }));
  } catch {
    return rows;
  }
};

class BiddingService {
  private localBids: CargoBidItem[] = [...mockDriverBids];

  async fetchDriverBids(driverId?: string): Promise<CargoBidItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          let query = client
            .from('cargo_bids')
            .select(BID_SELECT)
            .order('created_at', { ascending: false });

          if (driverId) {
            query = query.eq('driver_id', driverId);
          }

          const { data, error } = await query;
          if (!error && data) {
            const enriched = await attachDriverIdentity(client, data);
            return enriched.map(mapDbBid);
          }
          if (error) {
            console.warn('fetchDriverBids query error:', error.message);
          }
        }
      } catch (err) {
        console.warn('Fallback to local bids:', err);
      }
    }
    return [...this.localBids];
  }

  /**
   * All pending bids on a cargo (for the shipper tender desk), enriched with driver identity.
   */
  async fetchBidsForCargo(cargoId: string): Promise<CargoBidItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('cargo_bids')
            .select(BID_SELECT)
            .eq('cargo_id', cargoId)
            .in('status', ['PENDING', 'ACCEPTED'])
            .order('proposed_fare_tomans', { ascending: false });

          if (!error && data) {
            const enriched = await attachDriverIdentity(client, data);
            return enriched.map(mapDbBid);
          }
          if (error) {
            console.warn('fetchBidsForCargo query error:', error.message);
          }
        }
      } catch (err) {
        console.warn('Fallback to local cargo bids:', err);
      }
    }
    return this.localBids.filter((b) => b.cargoId === cargoId);
  }

  async submitBid(params: {
    cargoId: string;
    cargoTitle: string;
    originCity: string;
    destinationCity: string;
    originalPrice: string;
    proposedFareAmount: number;
    readyToLoadTime: string;
    driverNotes?: string;
    cargoWeight?: string;
    truckTypeRequired?: string;
    shipperName?: string;
  }): Promise<CargoBidItem> {
    const newBid: CargoBidItem = {
      id: `BID-${Date.now().toString().slice(-6)}`,
      cargoId: params.cargoId,
      cargoTitle: params.cargoTitle,
      originCity: params.originCity,
      destinationCity: params.destinationCity,
      originalPrice: params.originalPrice,
      proposedFareAmount: params.proposedFareAmount,
      proposedFareFormatted: toman(params.proposedFareAmount),
      readyToLoadTime: params.readyToLoadTime,
      driverNotes: params.driverNotes,
      status: 'PENDING',
      submittedAt: 'همین الان',
      expiresAt: '۴ ساعت دیگر',
      shipperName: params.shipperName || 'صاحب کالا TLD',
      shipperRating: 4.8,
      cargoWeight: params.cargoWeight || 'نامشخص',
      truckTypeRequired: params.truckTypeRequired || 'تریلی کفی',
    };

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client
          .from('cargo_bids')
          .insert({
            cargo_id: params.cargoId,
            proposed_fare_tomans: params.proposedFareAmount,
            ready_to_load_time: params.readyToLoadTime,
            driver_notes: params.driverNotes,
          })
          .select('id, created_at')
          .single();
        if (error) throw new Error(error.message);
        if (data?.id) newBid.id = data.id;
        if (data?.created_at) {
          newBid.submittedAt = new Date(data.created_at).toLocaleDateString('fa-IR');
        }
      }
    }

    this.localBids.unshift(newBid);
    return newBid;
  }

  async updateBidStatus(bidId: string, status: BidStatus): Promise<void> {
    this.localBids = this.localBids.map((b) =>
      b.id === bidId ? { ...b, status } : b
    );

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('cargo_bids').update({ status }).eq('id', bidId);
        if (error) throw new Error(error.message);
      }
    }
  }

  /**
   * Shipper accepts one pending bid through the server edge function. The cargo is assigned
   * to the driver, the agreed fare is locked and other pending bids are rejected.
   */
  async acceptDriverBid(cargoId: string, bidId: string): Promise<{
    driverId: string;
    agreedFareTomans: number;
    tripId: string;
  }> {
    const result = await escrowService.acceptDriverBid(cargoId, bidId);
    this.localBids = this.localBids.map((b) =>
      b.cargoId === cargoId
        ? { ...b, status: b.id === bidId ? 'ACCEPTED' : 'REJECTED' }
        : b
    );
    return { driverId: result.driverId, agreedFareTomans: result.agreedFareTomans, tripId: result.tripId };
  }

  async cancelBid(bidId: string): Promise<void> {
    await this.updateBidStatus(bidId, 'CANCELLED');
  }

  /**
   * راننده پیشنهاد متقابل صاحب بار را می‌پذیرد. تخصیص محموله و قفل کرایه فقط
   * از طریق تابع سرور (accept_counter_offer) انجام می‌شود.
   */
  async acceptCounterOffer(bidId: string): Promise<{
    driverId: string;
    agreedFareTomans: number;
    tripId: string;
    cargoId: string;
  }> {
    const result = await escrowService.acceptCounterOffer(bidId);
    this.localBids = this.localBids.map((b) =>
      b.id === bidId ? { ...b, status: 'ACCEPTED' as BidStatus } : b
    );
    return result;
  }
}

export const biddingService = new BiddingService();
