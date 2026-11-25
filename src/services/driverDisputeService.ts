import { DriverDisputeItem, DisputeType } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { mockDriverDisputes } from './mockDataProvider';

class DriverDisputeService {
  private localDisputes: DriverDisputeItem[] = [...mockDriverDisputes];

  async fetchDisputes(driverId?: string): Promise<DriverDisputeItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('driver_disputes')
            .select(`
              *,
              cargos (title)
            `)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map((d: any) => ({
              id: d.id,
              disputeType: d.dispute_type as DisputeType,
              title: d.title,
              tripId: d.trip_id,
              cargoTitle: d.cargos?.title || 'محموله ترانزیت',
              description: d.description,
              claimedAmount: Number(d.claimed_amount) || 0,
              claimedAmountFormatted: `${Number(d.claimed_amount).toLocaleString('fa-IR')} تومان`,
              status: d.status,
              evidencePhotos: d.evidence_photos || [],
              submittedAt: d.created_at ? new Date(d.created_at).toLocaleDateString('fa-IR') : '۱۴۰۳/۰۵/۱۴',
              arbitrationNote: d.arbitration_note,
              resolutionAmount: d.resolution_amount ? Number(d.resolution_amount) : undefined,
            }));
          }
        }
      } catch (err) {
        console.warn('Fallback to local disputes:', err);
      }
    }
    return [...this.localDisputes];
  }

  async submitDispute(params: {
    disputeType: DisputeType;
    title: string;
    description: string;
    claimedAmount: number;
    tripId?: string;
    cargoId?: string;
    cargoTitle?: string;
    evidencePhotos?: string[];
  }): Promise<DriverDisputeItem> {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('driver_disputes').insert({
          dispute_type: params.disputeType,
          title: params.title,
          description: params.description,
          claimed_amount: params.claimedAmount,
          trip_id: params.tripId,
          cargo_id: params.cargoId || null,
          evidence_photos: params.evidencePhotos || [],
          status: 'UNDER_REVIEW',
        });
        if (error) throw new Error(error.message);
      }
    }

    const newDispute: DriverDisputeItem = {
      id: `DSP-${Date.now().toString().slice(-6)}`,
      disputeType: params.disputeType,
      title: params.title,
      tripId: params.tripId,
      cargoTitle: params.cargoTitle,
      description: params.description,
      claimedAmount: params.claimedAmount,
      claimedAmountFormatted: `${params.claimedAmount.toLocaleString('fa-IR')} تومان`,
      status: 'UNDER_REVIEW',
      evidencePhotos: params.evidencePhotos || [],
      submittedAt: 'امروز',
      arbitrationNote: 'درخواست شما در واحد داوری و رسیدگی به شکایات TLD ثبت شد و حداکثر تا ۲۴ ساعت آینده بررسی می‌گردد.',
    };

    this.localDisputes.unshift(newDispute);
    return newDispute;
  }
}

export const driverDisputeService = new DriverDisputeService();
