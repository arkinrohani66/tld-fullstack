// TLD Logistics System Management & Dispatch Control Service (سامانه جامع مدیریت و دیسپچ مرکزی TLD)

export interface AdminPendingDriver {
  id: string;
  fullName: string;
  mobile: string;
  nationalId: string;
  smartCardNumber: string;
  licenseNumber: string;
  truckModel: string;
  plateNumber: string;
  capacityTons: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  documents: {
    driverLicense: string;
    smartCard: string;
    nationalCard: string;
    truckCard: string;
  };
}

export interface AdminCargoMonitor {
  id: string;
  title: string;
  origin: string;
  destination: string;
  shipperName: string;
  driverName?: string;
  driverPlate?: string;
  weightTons: number;
  fareTomans: number;
  status: 'WAITING_FOR_BID' | 'ASSIGNED' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'DISPUTED';
  currentLocation?: string;
  lastGpsUpdate?: string;
  tldSealLocked: boolean;
  waybillCode?: string;
}

export interface AdminPayoutRequest {
  id: string;
  driverName: string;
  driverMobile: string;
  iban: string;
  bankName: string;
  amountTomans: number;
  commissionDeductedTomans: number;
  requestedAt: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  trackingNumber?: string;
}

export interface AdminTelemetryDevice {
  deviceId: string;
  plateNumber: string;
  driverName: string;
  batteryPercent: number;
  fuelLevelPercent: number;
  speedKmh: number;
  isSealLocked: boolean;
  tamperAlert: boolean;
  lastPing: string;
  route: string;
}

class AdminService {
  private pendingDrivers: AdminPendingDriver[] = [];
  private cargoList: AdminCargoMonitor[] = [];
  private payoutRequests: AdminPayoutRequest[] = [];
  private telemetryDevices: AdminTelemetryDevice[] = [];

  getOverviewStats() {
    return {
      activeTrucksCount: this.telemetryDevices.length,
      totalDriversCount: this.pendingDrivers.length,
      pendingDriversCount: this.pendingDrivers.filter((d) => d.status === 'PENDING').length,
      activeCargosCount: this.cargoList.filter((c) => c.status === 'IN_TRANSIT' || c.status === 'LOADING').length,
      waitingCargosCount: this.cargoList.filter((c) => c.status === 'WAITING_FOR_BID').length,
      totalEscrowVolumeTomans: 0,
      totalPlatformCommissionTomans: 0,
      activeTelemetryBoxes: this.telemetryDevices.length,
      tamperAlertsCount: this.telemetryDevices.filter((t) => t.tamperAlert).length,
      rmtoGatewayStatus: 'ONLINE (متصل به وب‌سرویس راهداری)',
      serverTime: new Date().toLocaleTimeString('fa-IR'),
    };
  }

  getPendingDrivers(): AdminPendingDriver[] {
    return [...this.pendingDrivers];
  }

  approveDriver(driverId: string): boolean {
    const driver = this.pendingDrivers.find((d) => d.id === driverId);
    if (driver) {
      driver.status = 'APPROVED';
      return true;
    }
    return false;
  }

  rejectDriver(driverId: string, reason: string): boolean {
    const driver = this.pendingDrivers.find((d) => d.id === driverId);
    if (driver) {
      driver.status = 'REJECTED';
      driver.rejectionReason = reason;
      return true;
    }
    return false;
  }

  getAllCargos(): AdminCargoMonitor[] {
    return [...this.cargoList];
  }

  updateCargoStatus(cargoId: string, status: AdminCargoMonitor['status']): boolean {
    const cargo = this.cargoList.find((c) => c.id === cargoId);
    if (cargo) {
      cargo.status = status;
      return true;
    }
    return false;
  }

  getPayoutRequests(): AdminPayoutRequest[] {
    return [...this.payoutRequests];
  }

  approvePayout(payoutId: string): { success: boolean; trackingNumber: string } {
    const payout = this.payoutRequests.find((p) => p.id === payoutId);
    if (payout) {
      payout.status = 'PAID';
      payout.trackingNumber = `SHP-TRK-${Math.floor(100000000 + Math.random() * 900000000)}`;
      return { success: true, trackingNumber: payout.trackingNumber };
    }
    return { success: false, trackingNumber: '' };
  }

  getTelemetryDevices(): AdminTelemetryDevice[] {
    return [...this.telemetryDevices];
  }
}

export const adminService = new AdminService();
