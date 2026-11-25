// Platform Revenue and Commission Engine (سامانه درآمدی و خزانه‌داری هوشمند پلتفرم)
// Automatically deducts 5% commission from freight fares upon Escrow locking

export interface PlatformRevenueEntry {
  id: string;
  cargoId: string;
  cargoTitle: string;
  shipperName: string;
  driverName: string;
  freightAmountTomans: number;
  commissionRatePercent: number;
  commissionAmountTomans: number;
  vatTaxTomans: number;
  totalPlatformCutTomans: number;
  driverNetTomans: number;
  escrowRef: string;
  status: 'LOCKED_IN_ESCROW' | 'COLLECTED_IN_TREASURY' | 'REFUNDED';
  timestamp: string;
  txHash: string;
}

export interface PlatformRevenueSummary {
  commissionRatePercent: number;
  vatTaxPercent: number;
  totalProcessedFreightTomans: number;
  totalCommissionEarnedTomans: number;
  totalVatTaxCollectedTomans: number;
  todayCommissionTomans: number;
  pendingEscrowCommissionTomans: number;
  treasuryBalanceTomans: number;
  totalTripsWithCommission: number;
}

class PlatformRevenueService {
  private commissionRatePercent: number = 5.0; // ۵ درصد کارمزد مصوب سامانه
  private vatTaxPercent: number = 9.0; // ۹ درصد مالیات بر ارزش افزوده کارمزد

  private revenueLedger: PlatformRevenueEntry[] = [];

  private listeners: Array<() => void> = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // Get Commission Calculation for any freight
  public calculateCommission(freightAmountTomans: number) {
    const commissionTomans = Math.round((freightAmountTomans * this.commissionRatePercent) / 100);
    const vatTaxTomans = Math.round((commissionTomans * this.vatTaxPercent) / 100);
    const totalPlatformCutTomans = commissionTomans + vatTaxTomans;
    return {
      commissionRatePercent: this.commissionRatePercent,
      commissionTomans,
      vatTaxPercent: this.vatTaxPercent,
      vatTaxTomans,
      totalPlatformCutTomans,
      driverNetTomans: freightAmountTomans,
    };
  }

  // Get all revenue ledger entries
  public getRevenueLedger(): PlatformRevenueEntry[] {
    return this.revenueLedger;
  }

  // Get Platform Revenue Summary
  public getRevenueSummary(): PlatformRevenueSummary {
    const totalProcessed = this.revenueLedger.reduce((acc, curr) => acc + curr.freightAmountTomans, 0);
    const totalCommission = this.revenueLedger.reduce((acc, curr) => acc + curr.commissionAmountTomans, 0);
    const totalVat = this.revenueLedger.reduce((acc, curr) => acc + curr.vatTaxTomans, 0);
    const pendingCommission = this.revenueLedger
      .filter((e) => e.status === 'LOCKED_IN_ESCROW')
      .reduce((acc, curr) => acc + curr.commissionAmountTomans, 0);
    const collectedCommission = this.revenueLedger
      .filter((e) => e.status === 'COLLECTED_IN_TREASURY')
      .reduce((acc, curr) => acc + curr.commissionAmountTomans, 0);

    const paidEntries = this.revenueLedger.filter((e) => e.status === 'COLLECTED_IN_TREASURY');
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayCommission = paidEntries
      .filter((e) => {
        const raw = e.timestamp || '';
        const normalized = raw.slice(0, 10);
        return normalized === todayKey;
      })
      .reduce((acc, curr) => acc + curr.commissionAmountTomans, 0);

    return {
      commissionRatePercent: this.commissionRatePercent,
      vatTaxPercent: this.vatTaxPercent,
      totalProcessedFreightTomans: totalProcessed,
      totalCommissionEarnedTomans: totalCommission,
      totalVatTaxCollectedTomans: totalVat,
      // قبلاً این دو مقدار عددی ثابت و ساختگی بودند (۱,۲۱۰,۰۰۰ و ۱۵,۴۰۰,۰۰۰)
      // که باعث می‌شد داشبورد درآمد، مالی ناموجود نشان دهد.
      todayCommissionTomans: todayCommission,
      pendingEscrowCommissionTomans: pendingCommission,
      treasuryBalanceTomans: collectedCommission + totalVat,
      totalTripsWithCommission: this.revenueLedger.length,
    };
  }
}

export const platformRevenueService = new PlatformRevenueService();
