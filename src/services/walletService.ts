import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { WalletTransaction } from '../types';
import { mockTransactions } from './mockDataProvider';

export interface WalletSummary {
  /** Real withdrawable balance (wallets.balance_tomans) */
  walletBalance: string;
  /** Sum of wallet credits recorded today */
  driverIncomeToday: string;
  /** Sum of open escrow holds of this shipper */
  shipperPendingPayment: string;
  /** Sum of escrows released this month for this shipper */
  shipperSettledMonth: string;
  /** Absolute turnover of wallet transactions this month */
  monthlyTurnover: string;
}

const emptySummary = (): WalletSummary => ({
  walletBalance: '0',
  driverIncomeToday: '0',
  shipperPendingPayment: '0 تومان',
  shipperSettledMonth: '0 تومان',
  monthlyTurnover: '0 تومان',
});

const fmt = (n: number): string => n.toLocaleString('fa-IR');
const fmtToman = (n: number): string => `${n.toLocaleString('fa-IR')} تومان`;

const mapTransaction = (item: any): WalletTransaction => ({
  id: item.id,
  title: item.title,
  amount: `${item.type === 'DEBIT' ? '-' : '+'}${fmt(Number(item.amount_tomans) || 0)} تومان`,
  date: item.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : 'امروز',
  type: item.type || 'CREDIT',
  status: 'SUCCESS',
  relatedEntityId: item.related_entity_id,
});

export const walletService = {
  async fetchWalletBalance(userId?: string): Promise<number> {
    if (!isSupabaseConfigured()) return 0;
    const client = getSupabaseClient();
    if (!client) return 0;

    try {
      let query = client.from('wallets').select('balance_tomans');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query.maybeSingle();
      if (error || !data) return 0;
      return Number(data.balance_tomans) || 0;
    } catch (err) {
      console.error('Error in walletService.fetchWalletBalance:', err);
      return 0;
    }
  },

  async fetchWalletSummary(userId?: string): Promise<WalletSummary> {
    if (!isSupabaseConfigured()) {
      // Mock mode reports zeros: there is no real money without a backend.
      return emptySummary();
    }

    const client = getSupabaseClient();
    if (!client) return emptySummary();

    try {
      const summary = emptySummary();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Real wallet balance
      let walletQuery = client.from('wallets').select('balance_tomans');
      if (userId) walletQuery = walletQuery.eq('user_id', userId);
      const { data: walletData } = await walletQuery.maybeSingle();
      summary.walletBalance = fmt(Number(walletData?.balance_tomans) || 0);

      // 2. Today's credits
      let txQuery = client
        .from('wallet_transactions')
        .select('amount_tomans, type, created_at')
        .gte('created_at', todayStart.toISOString())
        .eq('type', 'CREDIT');
      if (userId) txQuery = txQuery.eq('user_id', userId);
      const { data: todayTx } = await txQuery;
      summary.driverIncomeToday = fmt((todayTx || []).reduce((acc, t: any) => acc + (Number(t.amount_tomans) || 0), 0));

      // 3. Monthly turnover (absolute)
      let monthTxQuery = client
        .from('wallet_transactions')
        .select('amount_tomans, created_at')
        .gte('created_at', monthStart.toISOString());
      if (userId) monthTxQuery = monthTxQuery.eq('user_id', userId);
      const { data: monthTx } = await monthTxQuery;
      summary.monthlyTurnover = fmtToman(
        (monthTx || []).reduce((acc, t: any) => acc + (Number(t.amount_tomans) || 0), 0)
      );

      // 4. Escrow-based shipper figures (RLS: shipper sees only own escrows)
      const { data: escrows } = await client
        .from('escrow_accounts')
        .select('freight_amount_tomans, status, released_at, shipper_id');
      const mine = (escrows || []).filter((e: any) => !userId || e.shipper_id === userId);
      summary.shipperPendingPayment = fmtToman(
        mine.filter((e: any) => e.status === 'HELD_SECURE').reduce((acc, e: any) => acc + (Number(e.freight_amount_tomans) || 0), 0)
      );
      const monthStartIso = monthStart.toISOString();
      summary.shipperSettledMonth = fmtToman(
        mine
          .filter((e: any) => e.status === 'RELEASED_TO_DRIVER' && e.released_at && e.released_at >= monthStartIso)
          .reduce((acc, e: any) => acc + (Number(e.freight_amount_tomans) || 0), 0)
      );

      return summary;
    } catch (err) {
      console.error('Error in walletService.fetchWalletSummary:', err);
      return emptySummary();
    }
  },

  async fetchTransactions(userId?: string): Promise<WalletTransaction[]> {
    if (!isSupabaseConfigured()) {
      return mockTransactions;
    }

    const client = getSupabaseClient();
    if (!client) return [];

    try {
      let query = client
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('fetchTransactions query error:', error.message);
        return mockTransactions;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(mapTransaction);
    } catch (err) {
      console.error('Error in walletService.fetchTransactions:', err);
      return [];
    }
  },

  /**
   * Wallet top-up requires a payment gateway which is not connected yet.
   * Returns null (nothing is charged, nothing is recorded) so the UI can show
   * an honest notice instead of a fake success.
   */
  async chargeWallet(_amount: string, _userId?: string): Promise<WalletTransaction | null> {
    return null;
  },
};
