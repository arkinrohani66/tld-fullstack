import {
  TLDBoxDeviceInfo,
  TLDSensorMetrics,
  TLDTelemetryHistoricalPoint,
  TLDSmartAlert,
  TLDAlertRuleConfig,
} from '../types';

export const initialTLDBoxInfo: TLDBoxDeviceInfo = {
  boxSerialNumber: 'TLD-PRO-9842-IR',
  model: 'TLD-PRO Gen 4 Heavy Fleet IoT Hub',
  firmwareVersion: 'v4.8.2-OTA-STABLE',
  imeiNumber: '864920194820194',
  hardwareStatus: 'OPTIMAL',
  primarySimCarrier: 'همراه اول 5G M2M',
  satelliteBackupStatus: 'ONLINE_IRIDIUM',
  batteryCapacityMah: 18000,
  batteryLevelPercent: 96,
  isSolarCharging: true,
  solarInputWatts: 4.8,
  externalPowerVoltage: 24.2,
  internalStorageRemainingMb: 3200,
  lastHeartbeatTime: 'هم‌اکنون (لحظه‌ای)',
  uptimeHours: 148,
  tamperSwitchTriggered: false,
  opticalLightSensorLux: 0.2, // Dark inside container
  ipRating: 'IP69K_WATERPROOF',
};

export const initialTLDSensorMetrics: TLDSensorMetrics = {
  // GPS & Dynamics
  currentLat: 35.854,
  currentLng: 53.421,
  altitudeMeters: 1140,
  headingDegrees: 85,
  currentSpeedKmH: 84,
  speedLimitKmH: 90,
  instantGForce: 0.08,
  harshBrakingDetected: false,
  rapidAccelDetected: false,
  // Temperature
  tempZone1Front: -19.4,
  tempZone2Middle: -18.8,
  tempZone3Rear: -18.2,
  tempAmbientExternal: 31.5,
  targetTempCelsius: -18.0,
  minAllowedTempCelsius: -22.0,
  maxAllowedTempCelsius: -15.0,
  // Weight & Load Cells
  grossTotalWeightTons: 38.6,
  netCargoWeightTons: 22.5,
  steerAxleWeightTons: 6.4,
  driveTandemWeightTons: 11.2,
  trailerTriAxleWeightTons: 21.0,
  loadBalanceDeviationPercent: 2.1,
  isWeightAnomalyDetected: false,
  // Environmental & Security
  relativeHumidityPercent: 42,
  barometricPressureHpa: 890,
  eLockStatus: 'LOCKED_SEALED',
  eLockCableLoopResistanceOhms: 11.8,
  doorOpenSensor: 'DOOR_CLOSED',
  // Routing & ETA
  originCity: 'تهران (شهرک صنعتی شمس‌آباد)',
  destinationCity: 'مشهد (شهرک صنعتی توس)',
  totalJourneyKm: 890,
  distanceCoveredKm: 470,
  distanceRemainingKm: 420,
  etaTimeFormatted: '۴ ساعت و ۴۵ دقیقه دیگر (ساعت ۲۱:۳۰)',
  etaRemainingMinutes: 285,
  isOffGeofenceRoute: false,
  geofenceDeviationMeters: 12,
};

export const initialHistoricalPoints: TLDTelemetryHistoricalPoint[] = [];

export const initialSmartAlerts: TLDSmartAlert[] = [];

export const initialAlertRuleConfig: TLDAlertRuleConfig = {
  tempMinCelsius: -22.0,
  tempMaxCelsius: -15.0,
  maxSpeedKmH: 95.0,
  weightLossToleranceKg: 100,
  geofenceToleranceMeters: 500,
  shockImpactThresholdG: 2.2,
  doorOpenAllowedSeconds: 60,
  smsAlertsEnabled: true,
  emergencySosEnabled: true,
};

class TLDTrackingServiceStore {
  private boxInfo: TLDBoxDeviceInfo = { ...initialTLDBoxInfo };
  private sensorMetrics: TLDSensorMetrics = { ...initialTLDSensorMetrics };
  private historyPoints: TLDTelemetryHistoricalPoint[] = [...initialHistoricalPoints];
  private alerts: TLDSmartAlert[] = [...initialSmartAlerts];
  private alertRules: TLDAlertRuleConfig = { ...initialAlertRuleConfig };

  // Listeners for live subscriptions
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  getBoxInfo(): TLDBoxDeviceInfo {
    return this.boxInfo;
  }

  getSensorMetrics(): TLDSensorMetrics {
    return this.sensorMetrics;
  }

  getHistoricalData(): TLDTelemetryHistoricalPoint[] {
    return this.historyPoints;
  }

  getAlerts(): TLDSmartAlert[] {
    return this.alerts;
  }

  getAlertRules(): TLDAlertRuleConfig {
    return this.alertRules;
  }

  // Update Alert Rules
  updateAlertRules(newRules: Partial<TLDAlertRuleConfig>) {
    this.alertRules = { ...this.alertRules, ...newRules };
    this.notify();
  }

  // Resolve Alert
  resolveAlert(alertId: string, actionNote: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.isResolved = true;
    alert.resolvedAt = 'هم‌اکنون';
    alert.actionTaken = actionNote;
    this.notify();
    return true;
  }

  // Remote Unlock E-Lock — requires the exact authorized passcode
  remoteUnlockSmartSeal(authorizedPasscode: string): { success: boolean; message: string } {
    if (authorizedPasscode !== '7492') {
      return { success: false, message: 'کد امنیتی احراز هویت نامعتبر است.' };
    }
    this.sensorMetrics.eLockStatus = 'AUTHORIZED_UNLOCKED';
    this.sensorMetrics.doorOpenSensor = 'DOOR_CLOSED';
    this.notify();
    return {
      success: true,
      message: 'فرمان بازگشایی امن پلمپ دیجیتال TLD ارسال و در لاگ سامانه ثبت شد.',
    };
  }

  // Remote Lock Smart Seal
  remoteLockSmartSeal(): { success: boolean; message: string } {
    this.sensorMetrics.eLockStatus = 'LOCKED_SEALED';
    this.sensorMetrics.doorOpenSensor = 'DOOR_CLOSED';
    this.notify();
    return {
      success: true,
      message: 'پلمپ الکترونیک هوشمند با موفقیت قفل و پایش سنسوری فعال شد.',
    };
  }

  // Simulation Anomaly Triggers for Demonstration
  triggerAnomaly(
    anomalyType: 'TEMP_SPIKE' | 'TAMPER_BREACH' | 'WEIGHT_DROP' | 'HARSH_IMPACT' | 'ROUTE_DEVIATION' | 'RESET_NORMAL'
  ) {
    if (anomalyType === 'RESET_NORMAL') {
      this.sensorMetrics = { ...initialTLDSensorMetrics };
      this.boxInfo.hardwareStatus = 'OPTIMAL';
      this.boxInfo.tamperSwitchTriggered = false;
      this.boxInfo.opticalLightSensorLux = 0.2;
      this.notify();
      return;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);

    if (anomalyType === 'TEMP_SPIKE') {
      this.sensorMetrics.tempZone1Front = -12.4;
      this.sensorMetrics.tempZone2Middle = -11.8;
      this.sensorMetrics.tempZone3Rear = -10.5;
      const newAlert: TLDSmartAlert = {
        id: `ALT-${randomId}`,
        category: 'TEMP_BREACH',
        severity: 'CRITICAL',
        title: 'هشدار بحرانی: افت سرمایش و افزایش غیرمجاز دمای محفظه بار',
        description: 'دمای زون عقب به منفی ۱۰.۵ درجه سانتی‌گراد رسید (حد بحرانی منفی ۱۵ درجه). احتمال خاموش شدن کمپرسور یا نشت گاز مبرد.',
        timestamp: 'هم‌اکنون (لحظه‌ای)',
        sensorValue: '-10.5 °C',
        thresholdValue: 'سقف مجاز -15.0 °C',
        isResolved: false,
        locationAddress: 'محور سمنان به شاهرود، کیلومتر ۴۲۰',
        coordinates: { lat: 35.854, lng: 53.421 },
        emergencyContactDispatched: true,
      };
      this.alerts.unshift(newAlert);
    } else if (anomalyType === 'TAMPER_BREACH') {
      this.sensorMetrics.eLockStatus = 'TAMPER_BREACH';
      this.sensorMetrics.doorOpenSensor = 'DOOR_WIDE_OPEN';
      this.sensorMetrics.eLockCableLoopResistanceOhms = 9999;
      this.boxInfo.tamperSwitchTriggered = true;
      this.boxInfo.opticalLightSensorLux = 145.0; // Light detected inside!
      this.boxInfo.hardwareStatus = 'TAMPER_ALERT';
      const newAlert: TLDSmartAlert = {
        id: `ALT-${randomId}`,
        category: 'E_LOCK_TAMPER',
        severity: 'CRITICAL',
        title: 'هشدار امنیتی فوق بحرانی: قطع کابل پلمپ و باز شدن غیرمجاز درب کانتینر',
        description: 'کابل پلمپ الکترونیک قطع شد و سنسور نوری افزایش لوکس نور محفظه بار را در حین حرکت ثبت کرد! مختصات فوراً ثبت شد.',
        timestamp: 'هم‌اکنون (لحظه‌ای)',
        sensorValue: 'قطع کابل Loop + نور 145 Lux',
        thresholdValue: 'پلمپ صفر لوکس',
        isResolved: false,
        locationAddress: 'کیلومتر ۴۲۵ جاده ترانزیت',
        coordinates: { lat: 35.854, lng: 53.421 },
        emergencyContactDispatched: true,
      };
      this.alerts.unshift(newAlert);
    } else if (anomalyType === 'WEIGHT_DROP') {
      this.sensorMetrics.netCargoWeightTons = 18.2; // Dropped 4.3 tons
      this.sensorMetrics.grossTotalWeightTons = 34.3;
      this.sensorMetrics.isWeightAnomalyDetected = true;
      const newAlert: TLDSmartAlert = {
        id: `ALT-${randomId}`,
        category: 'WEIGHT_DROP',
        severity: 'CRITICAL',
        title: 'هشدار کاهش ناگهانی وزن محموله (تخلیه یا سرقت مشکوک)',
        description: 'سنسورهای لودسل تعلیق کاهش ۴,۳۰۰ کیلوگرم وزن بار را در حین توقف بین‌راهی بدون ثبت دستور تخلیه تشخیص دادند.',
        timestamp: 'هم‌اکنون (لحظه‌ای)',
        sensorValue: 'افت ۴.۳ تن',
        thresholdValue: 'تلرانس ۱۰۰ کیلوگرم',
        isResolved: false,
        locationAddress: 'پارکینگ بین‌راهی کیلومتر ۳۹۰',
        coordinates: { lat: 35.82, lng: 53.38 },
        emergencyContactDispatched: true,
      };
      this.alerts.unshift(newAlert);
    } else if (anomalyType === 'HARSH_IMPACT') {
      this.sensorMetrics.instantGForce = 3.4;
      this.sensorMetrics.harshBrakingDetected = true;
      const newAlert: TLDSmartAlert = {
        id: `ALT-${randomId}`,
        category: 'HARSH_IMPACT',
        severity: 'WARNING',
        title: 'شوک حرکتی و ضربه شدید به محموله (3.4G)',
        description: 'سنسور ژیروسکوپ و شتاب‌سنج ۳ محوره TLD ضربه ناگهانی فراتر از حد استاندارد ثبت کردند. احتمال ترمز اضطراری شدید یا دست‌انداز عمیق.',
        timestamp: 'هم‌اکنون (لحظه‌ای)',
        sensorValue: '3.4 G-Force',
        thresholdValue: 'آستانه ۲.۲ G',
        isResolved: false,
        locationAddress: 'محور سمنان - شاهرود',
        coordinates: { lat: 35.854, lng: 53.421 },
        emergencyContactDispatched: false,
      };
      this.alerts.unshift(newAlert);
    } else if (anomalyType === 'ROUTE_DEVIATION') {
      this.sensorMetrics.isOffGeofenceRoute = true;
      this.sensorMetrics.geofenceDeviationMeters = 2450; // 2.4km off
      const newAlert: TLDSmartAlert = {
        id: `ALT-${randomId}`,
        category: 'ROUTE_DEVIATION',
        severity: 'WARNING',
        title: 'انحراف غیرمجاز از دالان ژئوفنس ترابری',
        description: 'خودرو از مسیر بزرگراه اصلی خارج شده و ۲,۴۵۰ متر در جاده فرعی حرکت نموده است.',
        timestamp: 'هم‌اکنون (لحظه‌ای)',
        sensorValue: 'انحراف ۲.۴ کیلومتر',
        thresholdValue: 'دالان ۵۰۰ متر',
        isResolved: false,
        locationAddress: 'جاده فرعی معدن، سمنان',
        coordinates: { lat: 35.78, lng: 53.22 },
        emergencyContactDispatched: false,
      };
      this.alerts.unshift(newAlert);
    }

    this.notify();
  }

  // Real-time tick simulation (subtle realistic fluctuations)
  tickSimulation() {
    this.sensorMetrics.currentSpeedKmH = Math.min(
      92,
      Math.max(65, Math.floor(this.sensorMetrics.currentSpeedKmH + (Math.random() * 4 - 2)))
    );
    if (this.sensorMetrics.tempZone1Front < -15) {
      this.sensorMetrics.tempZone1Front = +(this.sensorMetrics.tempZone1Front + (Math.random() * 0.1 - 0.05)).toFixed(1);
      this.sensorMetrics.tempZone2Middle = +(this.sensorMetrics.tempZone2Middle + (Math.random() * 0.1 - 0.05)).toFixed(1);
      this.sensorMetrics.tempZone3Rear = +(this.sensorMetrics.tempZone3Rear + (Math.random() * 0.1 - 0.05)).toFixed(1);
    }
    this.sensorMetrics.headingDegrees = (this.sensorMetrics.headingDegrees + 1) % 360;
    this.sensorMetrics.instantGForce = +(0.05 + Math.random() * 0.08).toFixed(2);
    this.notify();
  }
}

export const tldTrackingService = new TLDTrackingServiceStore();
