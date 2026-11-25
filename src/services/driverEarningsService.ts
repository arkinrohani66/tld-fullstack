import { DriverEarningRecord, DriverSettlementRecord } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { mockDriverEarnings, mockDriverSettlements } from './mockDataProvider';
import { walletService } from './walletService';

class DriverEarningsService {
  private localEarnings: DriverEarningRecord[] = [...mockDriverEarnings];
  private localSettlements: DriverSettlementRecord[] = [...mockDriverSettlements];

  async fetchEarnings(driverId?: string): Promise<DriverEarningRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('driver_earnings')
            .select(`
              *,
              cargos (title, origin_city, destination_city)
            `)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map((d: any) => ({
              id: d.id,
              tripId: d.trip_id || 'TRP-9021',
              cargoTitle: d.cargos?.title || 'محموله ترانزیت',
              originCity: d.cargos?.origin_city || 'تهران',
              destinationCity: d.cargos?.destination_city || 'بندرعباس',
              grossFare: Number(d.gross_fare_amount),
              commission: Number(d.commission_amount),
              tollDeduction: Number(d.toll_deduction_amount) || 0,
              netEarnings: Number(d.net_earnings_amount),
              date: d.date || '1403/05/20',
              status: d.status,
            }));
          }
        }
      } catch (err) {
        console.warn('Fallback to local earnings:', err);
      }
    }
    return [...this.localEarnings];
  }

  async fetchSettlements(driverId?: string): Promise<DriverSettlementRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('driver_settlements')
            .select('*')
            .order('requested_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map((s) => ({
              id: s.id,
              referenceCode: s.settlement_reference,
              amount: Number(s.amount),
              amountFormatted: `${Number(s.amount).toLocaleString('fa-IR')} تومان`,
              iban: s.iban,
              bankName: s.bank_name || '—',
              transferType: s.transfer_type,
              status: s.status,
              trackingCode: s.paya_tracking_code || '—',
              requestedAt: s.requested_at
                ? new Date(s.requested_at).toLocaleDateString('fa-IR')
                : 'امروز',
              settledAt: s.settled_at
                ? `واریز در ${new Date(s.settled_at).toLocaleDateString('fa-IR')}`
                : s.status === 'PROCESSING'
                  ? 'در صف واریز پایا'
                  : '—',
            }));
          }
        }
      } catch (err) {
        console.warn('Fallback to local settlements:', err);
      }
    }
    return [...this.localSettlements];
  }

  async requestInstantPayout(amount: number, iban: string, bankName: string): Promise<DriverSettlementRecord> {
    if (isSupabaseConfigured()) {
      // Payout cannot exceed the real withdrawable balance
      const balance = await walletService.fetchWalletBalance();
      if (amount > balance) {
        throw new Error(`مبلغ درخواستی بیشتر از موجودی قابل تسویه (${balance.toLocaleString('fa-IR')} تومان) است.`);
      }
    }

    const newSettlement: DriverSettlementRecord = {
      id: `STL-${Date.now().toString().slice(-6)}`,
      referenceCode: `PAYA-${Math.floor(10000000 + Math.random() * 90000000)}`,
      amount,
      amountFormatted: `${amount.toLocaleString('fa-IR')} تومان`,
      iban,
      bankName,
      transferType: 'PAYA',
      status: 'PROCESSING',
      trackingCode: `TRK-${Date.now().toString().slice(-8)}`,
      requestedAt: 'همین الان',
      settledAt: 'در صف واریز پایا (سیکل بعدی)',
    };

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) throw new Error('اتصال به پایگاه داده برقرار نیست.');

      // درخواست تسویه باید در یک تراکنش سرور، موجودی کیف پول را کسر کند؛
      // درج مستقیم ردیف در driver_settlements اجازه برداشت بی‌نهایت می‌داد.
      const { data, error } = await client.rpc('request_payout', {
        p_amount: Math.round(amount),
        p_iban: iban,
        p_bank_name: bankName,
      });
      if (error) {
        const msg = error.message || '';
        if (msg.includes('INSUFFICIENT_BALANCE')) {
          throw new Error(
            `مبلغ درخواستی بیشتر از موجودی قابل تسویه (${(await walletService.fetchWalletBalance()).toLocaleString('fa-IR')} تومان) است.`
          );
        }
        if (msg.includes('NO_WALLET')) {
          throw new Error('کیف پول فعالی برای این حساب یافت نشد.');
        }
        throw new Error(msg || 'درخواست تسویه ناموفق بود.');
      }

      if (data?.settlement_reference) {
        newSettlement.referenceCode = data.settlement_reference;
      }
      if (data?.paya_tracking_code) {
        newSettlement.trackingCode = data.paya_tracking_code;
      }
    }

    this.localSettlements.unshift(newSettlement);
    return newSettlement;
  }
}

export const driverEarningsService = new DriverEarningsService();
