import {
  ShipperFullCargo,
  ShipperDriverCandidate,
  DigitalSmartContract,
  ElectronicWaybill,
  CargoInsuranceSelection,
  EscrowAccountDetails,
  LiveTelemetrySnapshot,
  DeliveryProofPOD,
  OfficialTaxInvoice,
  ShipperDisputeRecord,
  UserProfile,
  ShipperDocuments,
  CargoItem,
} from '../types';
import { platformRevenueService } from './platformRevenueService';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { SupabaseShipper, SupabaseShipperDocument } from './supabaseTypes';

// Initial Empty Cargos for Shipper (Clean real state)
export const initialShipperCargos: ShipperFullCargo[] = [];

// Candidates for negotiation / comparison
export const mockDriverBidsForCargo: Record<string, ShipperDriverCandidate[]> = {};

/** Builds a renderable shipper cargo from a real DB row, merging any locally
 *  enriched wizard data when it exists for the same id. */
export const adaptDbCargoToShipperCargo = (c: CargoItem): ShipperFullCargo => {
  const local = shipperService.getCargoById(c.id);
  if (local) {
    // Real DB status wins when the assignment has happened server-side
    const status =
      c.status === 'DRIVER_ASSIGNED' && local.status === 'PENDING_DRIVER'
        ? 'DRIVER_ASSIGNED'
        : local.status;
    return {
      ...local,
      id: c.id,
      cargoNumber: local.cargoNumber || c.id,
      status,
      pricing: {
        ...local.pricing,
        // کرایه توافق‌شده ثبت‌شده در دیتابیس مرجع است؛ مقدار محلی ویزارد (برآورد AI)
        // نباید بر آن اولویت بگیرد، وگرنه اسکرو با مبلغ نادرست رد می‌شود.
        finalOfferedFareTomans: c.agreedFareTomans ?? local.pricing.finalOfferedFareTomans ?? 0,
      },
    };
  }
  return {
    id: c.id,
    cargoNumber: c.id,
    createdAt: 'ثبت‌شده در سامانه',
    status: c.status === 'DRIVER_ASSIGNED' ? 'DRIVER_ASSIGNED' : 'PENDING_DRIVER',
    assignedDriverId: c.assignedDriverId,
    assignedDriver: c.assignedDriverId
      ? {
          driverId: c.assignedDriverId,
          fullName: c.driverName || 'راننده تخصیص‌یافته',
          mobile: '—',
          nationalIdMasked: '—',
          smartCardNumber: '—',
          ratingScore: c.driverRating ?? 0,
          tierBadge: 'SILVER' as const,
          totalCompletedTrips: 0,
          onTimeDeliveryRate: 0,
          cargoIntegrityRate: 100,
          truckBrand: '',
          truckModel: c.driverTruck || '—',
          truckType: c.truckType,
          truckBuildYear: '—',
          plateNumber: '—',
          etaToOriginMinutes: 0,
          currentDistanceKm: 0,
          proposedFareTomans: c.agreedFareTomans ?? 0,
          fareFormatted: c.price,
          bidSubmittedAt: '—',
          healthCardValid: false,
          insuranceValid: false,
          status: 'ACCEPTED' as const,
        }
      : undefined,
    origin: {
      province: '',
      city: c.origin,
      address: '',
      contactPerson: '',
      contactPhone: '',
      loadingDate: '',
      loadingTimeWindow: '',
      loadingFacilities: [],
    },
    destination: {
      province: '',
      city: c.destination,
      address: '',
      receiverName: '',
      receiverPhone: '',
      unloadingDate: '',
      unloadingTimeWindow: '',
      unloadingFacilities: [],
    },
    cargoInfo: {
      title: c.title,
      category: 'COMMERCIAL_GOODS',
      declaredValueTomans: 0,
      packaging: 'PALLET',
      weightTons: c.weightTons ?? 0,
      requiresSmartLock: false,
      requiresLashingStraps: false,
    },
    fleetReq: {
      truckCategory: 'TRAILER',
      truckTypeName: c.truckType,
      bodyType: 'FLATBED',
      minCapacityTons: c.weightTons ?? 0,
      loadingFrom: 'ANY',
    },
    pricing: {
      baseTonKmRate: 0,
      distanceKm: 0,
      aiRecommendedFareTomans: c.agreedFareTomans ?? 0,
      marketMinFareTomans: 0,
      marketMaxFareTomans: 0,
      fuelTollFactor: 1,
      weatherTrafficFactor: 1,
      pricingMode: 'BIDDING_AUCTION',
      finalOfferedFareTomans: c.agreedFareTomans ?? 0,
    },
    insurance: {
      underwriter: 'بیمه ایران',
      coverageType: 'ALL_RISKS_CLAUSE_A',
      declaredValueTomans: 0,
      premiumRatePercent: 0,
      calculatedPremiumTomans: 0,
      deductiblePercent: 0,
      isIssued: false,
    },
    bidsCount: 0,
  };
};

class ShipperServiceStore {
  private cargos: ShipperFullCargo[] = [];
  private bidsMap: Record<string, ShipperDriverCandidate[]> = {};
  private disputes: ShipperDisputeRecord[] = [];

  // Get all cargos
  getCargos(): ShipperFullCargo[] {
    return this.cargos;
  }

  // Get active cargos
  getActiveCargos(): ShipperFullCargo[] {
    return this.cargos.filter(
      (c) =>
        c.status === 'PENDING_DRIVER' ||
        c.status === 'IN_NEGOTIATION' ||
        c.status === 'DRIVER_ASSIGNED' ||
        c.status === 'CONTRACT_SIGNED' ||
        c.status === 'ESCROW_FUNDED' ||
        c.status === 'LOADING' ||
        c.status === 'WAYBILL_ISSUED' ||
        c.status === 'IN_TRANSIT' ||
        c.status === 'ARRIVED_DESTINATION'
    );
  }

  // Get past delivered / settled cargos
  getPastCargos(): ShipperFullCargo[] {
    return this.cargos.filter(
      (c) => c.status === 'DELIVERED_CONFIRMED' || c.status === 'SETTLED' || c.status === 'CANCELLED'
    );
  }

  // Get cargo by ID
  getCargoById(id: string): ShipperFullCargo | undefined {
    return this.cargos.find((c) => c.id === id || c.cargoNumber === id);
  }

  /**
   * Resolves a cargo for display/report methods, falling back to a neutral
   * placeholder when the local store is empty so the UI never crashes.
   */
  private resolveCargo(cargoId: string): ShipperFullCargo {
    const found = this.getCargoById(cargoId) || this.cargos[0];
    if (found) return found;
    return {
      id: cargoId || '—',
      cargoNumber: cargoId || '—',
      createdAt: '—',
      status: 'DRAFT',
      origin: {
        province: '—',
        city: '—',
        address: '—',
        contactPerson: '—',
        contactPhone: '—',
        loadingDate: '—',
        loadingTimeWindow: '—',
        loadingFacilities: [],
      },
      destination: {
        province: '—',
        city: '—',
        address: '—',
        receiverName: '—',
        receiverPhone: '—',
        unloadingDate: '—',
        unloadingTimeWindow: '—',
        unloadingFacilities: [],
      },
      cargoInfo: {
        title: '—',
        category: 'COMMERCIAL_GOODS',
        declaredValueTomans: 0,
        packaging: 'PALLET',
        weightTons: 0,
        requiresSmartLock: false,
        requiresLashingStraps: false,
      },
      fleetReq: {
        truckCategory: 'TRAILER',
        truckTypeName: '—',
        bodyType: 'FLATBED',
        minCapacityTons: 0,
        loadingFrom: 'ANY',
      },
      pricing: {
        baseTonKmRate: 0,
        distanceKm: 0,
        aiRecommendedFareTomans: 0,
        marketMinFareTomans: 0,
        marketMaxFareTomans: 0,
        fuelTollFactor: 1,
        weatherTrafficFactor: 1,
        pricingMode: 'BIDDING_AUCTION',
        finalOfferedFareTomans: 0,
      },
      insurance: {
        underwriter: 'بیمه ایران',
        coverageType: 'ALL_RISKS_CLAUSE_A',
        declaredValueTomans: 0,
        premiumRatePercent: 0,
        calculatedPremiumTomans: 0,
        deductiblePercent: 0,
        isIssued: false,
      },
      bidsCount: 0,
    };
  }

  // Create new cargo through the 6-step Wizard
  createCargo(cargoData: Omit<ShipperFullCargo, 'id' | 'cargoNumber' | 'createdAt' | 'bidsCount'>): ShipperFullCargo {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const cargoNumber = `CRG-${randomNum}-${cargoData.origin.city.slice(0, 2)}`;
    const newCargo: ShipperFullCargo = {
      ...cargoData,
      id: `CRG-${randomNum}`,
      cargoNumber,
      createdAt: 'هم‌اکنون',
      bidsCount: 0,
    };
    this.cargos.unshift(newCargo);
    return newCargo;
  }

  // Get bids for a specific cargo
  getBidsForCargo(cargoId: string): ShipperDriverCandidate[] {
    return this.bidsMap[cargoId] || this.bidsMap['CRG-9021'] || [];
  }

  // Accept a driver bid (mirrors the server-side assignment in the local cache)
  acceptDriverBid(cargoId: string, driverId: string, candidate?: ShipperDriverCandidate): boolean {
    const cargo = this.getCargoById(cargoId);
    if (!cargo) return false;

    const c = candidate || this.getBidsForCargo(cargoId).find((b) => b.driverId === driverId);
    if (!c) return false;

    c.status = 'ACCEPTED';
    cargo.assignedDriver = c;
    cargo.status = 'DRIVER_ASSIGNED';
    cargo.contractId = `CTR-${cargo.id}-DIG`;
    cargo.pricing.finalOfferedFareTomans = c.proposedFareTomans;
    return true;
  }

  // Counter-offer to driver
  counterOfferDriver(cargoId: string, driverId: string, newAmountTomans: number): boolean {
    const bids = this.getBidsForCargo(cargoId);
    const candidate = bids.find((b) => b.driverId === driverId);
    if (!candidate) return false;

    candidate.status = 'COUNTERED';
    candidate.proposedFareTomans = newAmountTomans;
    candidate.fareFormatted = `${newAmountTomans.toLocaleString('fa-IR')} تومان`;
    return true;
  }

  // Generate or get Digital Smart Contract
  getDigitalContract(cargoId: string): DigitalSmartContract {
    const cargo = this.resolveCargo(cargoId);
    const driver = cargo.assignedDriver || {
      fullName: 'محمدرضا سلطانی',
      nationalIdMasked: '۰۰۷***۲۸۹۱',
      smartCardNumber: '۲۹۸۴۷۱۲',
      plateNumber: '۳۴ ع ۵۸۲ ایران ۷۲',
      proposedFareTomans: 38500000,
    };

    return {
      contractNumber: `CTR-${cargo.id}-2024`,
      cargoId: cargo.id,
      cargoTitle: cargo.cargoInfo.title,
      shipperName: cargo.origin.contactPerson || 'فرستنده محموله',
      shipperCompany: 'صاحب‌بار رسمی',
      shipperNationalId: '۱۰۱۰۲۸۳۹۴۷۲',
      driverName: driver.fullName,
      driverNationalId: driver.nationalIdMasked,
      driverSmartCard: driver.smartCardNumber,
      truckPlate: driver.plateNumber,
      originAddress: `${cargo.origin.city} - ${cargo.origin.address}`,
      destinationAddress: `${cargo.destination.city} - ${cargo.destination.address}`,
      agreedFareTomans: cargo.pricing.finalOfferedFareTomans || 38500000,
      escrowPaymentRef: `ESC-${cargo.id}-SHP`,
      demurrageRatePerHourTomans: 350000,
      loadingTimeAllowanceHours: 4,
      unloadingTimeAllowanceHours: 4,
      penaltyPerDayDelayTomans: 2500000,
      insurancePolicyNumber: cargo.insurance.policyNumber || 'IR-INS-8849204-TR',
      insuranceUnderwriter: cargo.insurance.underwriter || 'بیمه ایران',
      termsAndConditions: [
        'راننده متعهد می‌گردد محموله را در ساعت مقرر در مبدأ بارگیری و در مقصد سالم تحویل نماید.',
        'صاحب کالا موظف است کرایه توافق‌شده را در حساب امانی سامانه واریز نماید و پس از تخلیه بلامانع تسویه شود.',
        'حق توقف (دموراژ) بعد از پایان مهلت ۴ ساعته بارگیری/تخلیه بر مبنای ساعتی ۳۵۰,۰۰۰ تومان محاسبه می‌شود.',
        'هرگونه مهاربندی، چادربندی و قفل هوشمند پلمپ دیجیتال بر عهده راننده می‌باشد.',
        'مرجع رسیدگی به اختلافات، هیئت داوری سامانه هوشمند ترابری است.',
      ],
      shipperSignatureDate: '۱۴۰۳/۰۶/۱۰ ساعت ۱۰:۰۰',
      driverSignatureDate: '۱۴۰۳/۰۶/۱۰ ساعت ۱۰:۰۵',
      isFullyExecuted: true,
      legalHash: 'SHA256: 9e3f1c8a4b2d7e5f1029c48576abec8492019284758392010293847561a0e82c',
    };
  }

  // Generate or get Electronic Waybill (بارنامه الکترونیک راهداری)
  getElectronicWaybill(cargoId: string): ElectronicWaybill {
    const cargo = this.resolveCargo(cargoId);
    const driver = cargo.assignedDriver || {
      fullName: 'محمدرضا سلطانی',
      nationalIdMasked: '۰۰۷۱۸۴۲۸۹۱',
      smartCardNumber: '۲۹۸۴۷۱۲',
      plateNumber: '۳۴ ع ۵۸۲ ایران ۷۲',
    };

    return {
      waybillNumber: `WBL-${cargo.id}-RMTO`,
      rmtoTrackingCode: '۹۸۴۷۲۹۱۸۴۷۲۶۱۹',
      issuedDate: '۱۴۰۳/۰۶/۱۰ ساعت ۱۰:۴۵',
      originTerminal: `پایانه باربری ${cargo.origin.province}`,
      destinationTerminal: `پایانه باربری ${cargo.destination.province}`,
      shipperFullName: cargo.origin.contactPerson || 'صاحب بار محموله',
      receiverFullName: cargo.destination.receiverName,
      driverFullName: driver.fullName,
      driverNationalCode: '۰۰۷۱۸۴۲۸۹۱',
      driverLicenseNumber: '۸۸۴۹۲۰۳۴',
      driverSmartCard: driver.smartCardNumber,
      truckPlateNumber: driver.plateNumber,
      truckSmartCard: '۸۸۲۹۱۷۴',
      cargoDescription: cargo.cargoInfo.title,
      netWeightTons: cargo.cargoInfo.weightTons,
      grossWeightTons: cargo.cargoInfo.weightTons + 14.2,
      fareAmountTomans: cargo.pricing.finalOfferedFareTomans,
      // نرخ رسمی سامانه ۵٪ کرایه است (نه ۸٪) و باید همان عدد اسکرو باشد.
      commissionTomans: platformRevenueService.calculateCommission(cargo.pricing.finalOfferedFareTomans).commissionTomans,
      terminalFeeTomans: 120000,
      roadTollTomans: 95000,
      insuranceFeeTomans: cargo.insurance.calculatedPremiumTomans,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=RMTO-WAYBILL-98472918472619',
      barcodeNumber: '889201948271',
      status: 'ACTIVE_VALID',
    };
  }

  // Get Escrow Account details
  getEscrowDetails(cargoId: string): EscrowAccountDetails {
    const cargo = this.resolveCargo(cargoId);
    const fare = cargo.pricing.finalOfferedFareTomans;
    const commission = platformRevenueService.calculateCommission(fare).commissionTomans;
    const insurance = cargo.insurance.calculatedPremiumTomans || 510000;
    // VAT فقط به کارمزد پلتفرم تعلق می‌گیرد (۹٪ × کارمزد)، نه به بیمه.
    const tax = Math.round((commission * 9) / 100);
    const total = fare + commission + insurance + tax;

    return {
      escrowId: `ESC-${cargo.id}-SHP`,
      cargoId: cargo.id,
      totalHoldAmountTomans: total,
      breakdown: {
        driverNetFare: fare,
        platformCommission: commission,
        insurancePremium: insurance,
        taxAndVat: tax,
      },
      status: cargo.escrowStatus === 'RELEASED' ? 'RELEASED_TO_DRIVER' : 'HELD_SECURE',
      gatewayTransactionRef: 'SHP-9847291847-SEP',
      fundedAt: '۱۴۰۳/۰۶/۱۰ ساعت ۰۹:۵۵',
      releaseOtpCode: '۷۴۹۱',
    };
  }

  // Deposit funds into escrow (and automatically collect 5% platform commission)
  depositEscrow(cargoId: string, refId: string): boolean {
    const cargo = this.getCargoById(cargoId);
    if (!cargo) return false;
    cargo.escrowStatus = 'HELD_IN_ESCROW';
    cargo.status = 'ESCROW_FUNDED';
    return true;
  }

  // Release funds from escrow to driver (upon POD)
  releaseEscrow(cargoId: string): boolean {
    const cargo = this.getCargoById(cargoId);
    if (!cargo) return false;
    cargo.escrowStatus = 'RELEASED';
    cargo.status = 'SETTLED';
    return true;
  }

  // Get Live IoT Tracking Telemetry
  getLiveTelemetry(cargoId: string): LiveTelemetrySnapshot {
    const cargo = this.resolveCargo(cargoId);
    return {
      cargoId: cargo.id,
      driverId: cargo.assignedDriver?.driverId || 'DRV-901',
      currentLat: 35.854,
      currentLng: 53.421,
      currentAddress: 'سمنان، کیلومتر ۳۵ بزرگراه امام رضا (ع) - روبروی مجتمع رفاهی آفتاب',
      currentSpeedKmH: 84,
      speedLimitKmH: 90,
      estimatedRemainingKm: 420,
      estimatedRemainingMinutes: 285,
      temperatureCelsius: cargo.cargoInfo.category === 'FOOD_PERISHABLE' ? -18.2 : 22.4,
      targetTempCelsius: cargo.cargoInfo.category === 'FOOD_PERISHABLE' ? -18.0 : undefined,
      ambientHumidityPercent: 32,
      smartLockStatus: 'LOCKED_SEALED',
      smartSealCode: 'SEAL-IoT-8892-GREEN',
      batteryLevelPercent: 94,
      networkSignal: '5G',
      lastUpdated: 'هم‌اکنون (لحظه‌ای)',
      isOffRoute: false,
      routeCheckpoints: [
        { title: 'بارگیری در مبدأ و صدور بارنامه', location: 'تهران - شهرک شمس‌آباد', passed: true, passedTime: '۱۰:۳۰' },
        { title: 'پلمپ هوشمند کانتینر (IoT Seal)', location: 'درب خروج کارخانه', passed: true, passedTime: '۱۱:۰۰' },
        { title: 'عوارضی گرمسار - سمنان', location: 'کیلومتر ۹۵ آزادراه حرم تا حرم', passed: true, passedTime: '۱۲:۴۵' },
        { title: 'ایستگاه بازرسی شاهرود', location: 'کیلومتر ۳۸۰', passed: false },
        { title: 'ورود به مشهد و تخلیه انبار', location: 'مشهد - شهرک صنعتی توس', passed: false },
      ],
    };
  }

  // Get Delivery Proof POD
  getDeliveryPOD(cargoId: string): DeliveryProofPOD {
    const cargo = this.resolveCargo(cargoId);
    return {
      cargoId: cargo.id,
      cargoNumber: cargo.cargoNumber,
      receiverName: cargo.destination.receiverName,
      receiverMobile: cargo.destination.receiverPhone,
      deliveredAt: '۱۴۰۳/۰۶/۱۱ ساعت ۱۴:۳۰',
      unloadingAddress: cargo.destination.address,
      receiverOtpCodeEntered: '749201',
      receiverSignatureDataUrl: '',
      goodsConditionNotes: 'محموله بدون کم‌وکاست با پلمپ سالم تخلیه شد.',
      deliveredPhotos: ['/assets/images/pod1.jpg'],
      isAcceptedWithoutReservation: true,
    };
  }

  // Submit delivery confirmation POD
  submitDeliveryPOD(podData: DeliveryProofPOD): boolean {
    const cargo = this.getCargoById(podData.cargoId);
    if (!cargo) return false;
    cargo.status = 'DELIVERED_CONFIRMED';
    cargo.escrowStatus = 'RELEASED';
    return true;
  }

  // Submit driver rating (persists a real review when Supabase is configured)
  async submitDriverRating(data: {
    cargoId: string;
    driverId: string;
    overallScore: number;
    punctualityScore: number;
    cargoCareScore: number;
    professionalismScore: number;
    truckConditionScore: number;
    comment: string;
    tags: string[];
    shipperName?: string;
    shipperCompany?: string;
    tripRoute?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const client = getSupabaseClient();
    if (!client) return true;

    try {
      const { data: userData } = await client.auth.getUser();

      // driverId is a profile (auth user) id; resolve the drivers row
      const { data: driverRow } = await client
        .from('drivers')
        .select('id')
        .eq('profile_id', data.driverId)
        .maybeSingle();
      if (!driverRow?.id) {
        console.warn('submitDriverRating: driver row not found for profile', data.driverId);
        return false;
      }

      const { error } = await client.from('driver_reviews').insert({
        driver_id: driverRow.id,
        shipper_id: userData?.user?.id,
        cargo_id: data.cargoId || null,
        shipper_name: data.shipperName || 'صاحب کالا',
        shipper_company: data.shipperCompany || '',
        rating: Math.min(5, Math.max(1, Number(data.overallScore.toFixed(1)))),
        comment: data.comment,
        trip_route: data.tripRoute || '',
        tags: data.tags || [],
      });
      if (error) {
        console.warn('submitDriverRating insert error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('submitDriverRating exception:', err);
      return false;
    }
  }

  // Get official tax invoice
  getOfficialInvoice(cargoId: string): OfficialTaxInvoice {
    const cargo = this.resolveCargo(cargoId);
    const netFare = cargo.pricing.finalOfferedFareTomans || 38500000;
    const serviceFee = platformRevenueService.calculateCommission(netFare).commissionTomans;
    const insurance = cargo.insurance.calculatedPremiumTomans || 510000;
    // مالیات ارزش افزوده فقط روی کارمزد خدمات محاسبه می‌شود (۹٪)، نه روی بیمه.
    const vat = Math.round((serviceFee * 9) / 100);
    const total = netFare + serviceFee + insurance + vat;

    return {
      invoiceNumber: `INV-1403-${cargo.id.replace('CRG-', '')}`,
      taxUniqueId: `A194820194857201948271`,
      issueDate: '۱۴۰۳/۰۶/۱۱',
      fiscalPeriod: 'تابستان ۱۴۰۳',
      sellerInfo: {
        legalName: 'شرکت مهندسی ترابری و لجستیک هوشمند راهبر',
        economicCode: '۴۱۱۵۸۴۹۲۰۳۹۱',
        nationalId: '۱۰۳۲۰۸۵۹۲۰۱',
        postalCode: '۱۹۹۸۸۷۷۶۶۵',
        address: 'تهران، سعادت‌آباد، خیابان سرو غربی، برج پایتخت، طبقه ۸',
        phone: '۰۲۱-۸۸۹۹۰۰۱۱',
      },
      buyerInfo: {
        fullNameOrCompany: cargo.origin.contactPerson || 'صاحب‌بار',
        economicCode: '۴۱۱۶۷۷۸۸۹۹۲۲',
        nationalId: '۱۰۱۰۲۸۳۹۴۷۲',
        postalCode: '۱۴۳۵۶۷۸۹۰۱',
        address: cargo.origin.address,
        phone: '۰۲۱-۵۵۶۶۷۷۸۸',
      },
      itemDescription: `خدمات حمل و نقل بار جاده‌ای ${cargo.cargoInfo.title} از ${cargo.origin.city} به ${cargo.destination.city}`,
      cargoNumber: cargo.cargoNumber,
      route: `${cargo.origin.city} به ${cargo.destination.city} (${cargo.pricing.distanceKm} کیلومتر)`,
      netFareTomans: netFare,
      serviceFeeTomans: serviceFee,
      insuranceTomans: insurance,
      subtotalTomans: serviceFee + insurance,
      vat9PercentTomans: vat,
      totalPayableTomans: total,
      paymentMethod: 'ESCROW_SETTLED_SHAPARAK',
      paymentTrackingRef: 'SHP-9847291847-SEP',
      qrVerificationUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TAX-INVOICE-${cargo.id}`,
    };
  }

  // Get Shipper Disputes
  getDisputes(): ShipperDisputeRecord[] {
    return this.disputes;
  }

  // Register a new dispute
  createDispute(disputeData: Omit<ShipperDisputeRecord, 'id' | 'status' | 'submittedAt'>): ShipperDisputeRecord {
    const randomId = Math.floor(100 + Math.random() * 900);
    const newDispute: ShipperDisputeRecord = {
      ...disputeData,
      id: `DSP-SHP-${randomId}`,
      status: 'REGISTERED',
      submittedAt: 'هم‌اکنون',
    };
    this.disputes.unshift(newDispute);
    return newDispute;
  }

  // ==========================================
  // SUPABASE SHIPPERS PERSISTENCE & REGISTRATION
  // ==========================================
  async saveShipperRegistration(
    userId: string,
    profileData: UserProfile
  ): Promise<{ success: boolean; shipperId: string; message: string }> {
    const shipperCompany = profileData.shipperCompany;
    const shipperLocations = profileData.shipperLocations;
    const shipperBank = profileData.shipperBank;
    const shipperDocs = profileData.shipperDocuments;

    const generatedShipperId = `SHP-${Date.now().toString().slice(-6)}`;

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          // Resolve the real Supabase auth user id (local USR-xxx ids are not database uuids)
          const { data: userData } = await client.auth.getUser();
          const authUserId = userData?.user?.id || userId;

          // 1. Update the profile row created by the handle_new_user trigger.
          // Upserting with a client-supplied `id` can violate profiles_user_id_key.
          const { error: profileError } = await client
            .from('profiles')
            .update({
              full_name: profileData.fullName || shipperCompany?.companyName || 'صاحب بار محترم',
              national_id: profileData.nationalId || shipperCompany?.nationalCompanyId || '',
              phone: profileData.mobile || '',
              email: profileData.email || '',
              role: 'SHIPPER',
              verification_status: 'PENDING',
              company_name: shipperCompany?.companyName || profileData.companyName || '',
              province: shipperLocations?.officeProvince || profileData.province || 'تهران',
              city: shipperLocations?.officeCity || profileData.city || 'تهران',
              address: shipperLocations?.officeAddress || profileData.address || '',
              postal_code: shipperLocations?.officePostalCode || profileData.postalCode || '',
              avatar_url: profileData.profileImage || '',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', authUserId);
          if (profileError) {
            console.warn('shipper profile update failed:', profileError.message);
          }

          // 2. Upsert in shippers table
          const shipperRecord: Partial<SupabaseShipper> = {
            id: generatedShipperId,
            profile_id: authUserId,
            user_id: authUserId,
            shipper_type: shipperCompany?.shipperType || 'LEGAL_ENTITY',
            company_name: shipperCompany?.companyName || profileData.fullName || 'شرکت تجاری',
            company_type: shipperCompany?.companyType || 'سهامی خاص',
            national_company_id: shipperCompany?.nationalCompanyId || '',
            registration_number: shipperCompany?.registrationNumber || '',
            economic_code: shipperCompany?.economicCode || '',
            establishment_date: shipperCompany?.establishmentDate || '',
            industry_sector: shipperCompany?.industrySector || 'تولیدی و صنعتی',
            monthly_freight_volume_tons: parseFloat(shipperCompany?.monthlyFreightVolumeTons || '0') || 0,
            preferred_truck_types: shipperCompany?.preferredTruckTypes || ['ترانزیت چادری', 'کفی'],
            ceo_full_name: shipperCompany?.ceoFullName || profileData.fullName || '',
            ceo_national_id: shipperCompany?.ceoNationalId || profileData.nationalId || '',
            ceo_mobile: shipperCompany?.ceoMobile || profileData.mobile || '',
            landline_phone: shipperCompany?.landlinePhone || '',
            website: shipperCompany?.website || '',
            office_province: shipperLocations?.officeProvince || 'تهران',
            office_city: shipperLocations?.officeCity || 'تهران',
            office_postal_code: shipperLocations?.officePostalCode || '',
            office_address: shipperLocations?.officeAddress || '',
            warehouse_province: shipperLocations?.warehouseProvince || 'تهران',
            warehouse_city: shipperLocations?.warehouseCity || 'تهران',
            warehouse_address: shipperLocations?.warehouseAddress || '',
            warehouse_contact_person: shipperLocations?.warehouseContactPerson || '',
            warehouse_contact_phone: shipperLocations?.warehouseContactPhone || '',
            warehouse_facilities: shipperLocations?.warehouseFacilities || ['لیفتراک', 'باسکول'],
            bank_name: shipperBank?.bankName || 'بانک ملت',
            bank_iban: shipperBank?.iban || '',
            bank_account_number: shipperBank?.accountNumber || '',
            bank_branch: shipperBank?.bankBranch || '',
            account_holder_name: shipperBank?.accountHolderName || shipperCompany?.companyName || '',
            registration_step: 5,
            verification_status: 'PENDING',
            updated_at: new Date().toISOString(),
          };

          const { data: insertedShipper, error: shipperError } = await client
            .from('shippers')
            .upsert(shipperRecord, { onConflict: 'profile_id' })
            .select()
            .maybeSingle();

          if (shipperError) {
            console.warn('Supabase shippers table upsert error:', shipperError);
            // قبلاً خطا فقط لاگ می‌شد و کاربر پیام موفقیت می‌دید، در حالی که هیچ
            // ردیفی در دیتابیس ثبت نشده بود.
            return {
              success: false,
              shipperId: generatedShipperId,
              message: `ثبت اطلاعات صاحب بار در پایگاه داده ناموفق بود: ${shipperError.message}`,
            };
          }

          const activeShipperId = insertedShipper?.id || generatedShipperId;

          // 3. Insert documents in shipper_documents table
          if (shipperDocs) {
            const docEntries: { docType: string; title: string; url?: string }[] = [
              { docType: 'OFFICIAL_GAZETTE', title: 'روزنامه رسمی تاسیس و آخرین تغییرات', url: shipperDocs.officialGazette },
              { docType: 'VAT_CERTIFICATE', title: 'گواهی ثبت نام ارزش افزوده', url: shipperDocs.vatCertificate },
              { docType: 'BUSINESS_LICENSE', title: 'پروانه بهره‌برداری / جواز کسب', url: shipperDocs.businessLicense },
              { docType: 'NATIONAL_CARD_CEO_FRONT', title: 'کارت ملی مدیرعامل (رو)', url: shipperDocs.nationalCardCeoFront },
              { docType: 'NATIONAL_CARD_CEO_BACK', title: 'کارت ملی مدیرعامل (پشت)', url: shipperDocs.nationalCardCeoBack },
              { docType: 'AUTHORIZATION_LETTER', title: 'معرفی‌نامه نماینده قانونی', url: shipperDocs.authorizationLetter },
              { docType: 'BANK_IBAN_CONFIRMATION', title: 'تاییدیه شماره شبا بانکی', url: shipperDocs.bankIbanConfirmation },
              { docType: 'FACTORY_OWNERSHIP_LEASE', title: 'سند مالکیت یا اجاره‌نامه کارخانه/انبار', url: shipperDocs.factoryOwnershipLease },
              { docType: 'SIGNATURE_SPECIMEN', title: 'گواهی امضای صاحبان امضا', url: shipperDocs.signatureSpecimen },
            ];

            for (const doc of docEntries) {
              if (doc.url) {
                const { error: docError } = await client.from('shipper_documents').upsert(
                  {
                    shipper_id: activeShipperId,
                    profile_id: authUserId,
                    doc_type: doc.docType,
                    title: doc.title,
                    file_url: doc.url,
                    verification_status: 'PENDING',
                    uploaded_at: new Date().toISOString(),
                  },
                  { onConflict: 'profile_id,doc_type' }
                );
                if (docError) console.warn('shipper_documents upsert error:', docError.message);
              }
            }
          }

          return {
            success: true,
            shipperId: activeShipperId,
            message: 'اطلاعات و مدارک کامل صاحب بار با موفقیت در پایگاه داده سوپابیس ثبت و ارسال شد.',
          };
        } catch (err) {
          console.warn('Supabase Shipper Registration exception, continuing with local persistence:', err);
        }
      }
    }

    // Local fallback
    return {
      success: true,
      shipperId: generatedShipperId,
      message: 'ثبت‌نام صاحب بار با مدارک کامل با موفقیت انجام شد (حالت محلی/آفلاین).',
    };
  }

  // Fetch Shipper Details from Supabase
  async getShipperFullProfile(userId: string): Promise<Partial<UserProfile> | null> {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: shipperData } = await client
            .from('shippers')
            .select('*')
            .eq('profile_id', userId)
            .maybeSingle();

          if (shipperData) {
            const { data: docsData } = await client
              .from('shipper_documents')
              .select('*')
              .eq('profile_id', userId);

            const docsMap: ShipperDocuments = {};
            if (docsData) {
              docsData.forEach((d: SupabaseShipperDocument) => {
                if (d.doc_type === 'OFFICIAL_GAZETTE') docsMap.officialGazette = d.file_url;
                if (d.doc_type === 'VAT_CERTIFICATE') docsMap.vatCertificate = d.file_url;
                if (d.doc_type === 'BUSINESS_LICENSE') docsMap.businessLicense = d.file_url;
                if (d.doc_type === 'NATIONAL_CARD_CEO_FRONT') docsMap.nationalCardCeoFront = d.file_url;
                if (d.doc_type === 'NATIONAL_CARD_CEO_BACK') docsMap.nationalCardCeoBack = d.file_url;
                if (d.doc_type === 'AUTHORIZATION_LETTER') docsMap.authorizationLetter = d.file_url;
                if (d.doc_type === 'BANK_IBAN_CONFIRMATION') docsMap.bankIbanConfirmation = d.file_url;
                if (d.doc_type === 'FACTORY_OWNERSHIP_LEASE') docsMap.factoryOwnershipLease = d.file_url;
                if (d.doc_type === 'SIGNATURE_SPECIMEN') docsMap.signatureSpecimen = d.file_url;
              });
            }

            return {
              fullName: shipperData.ceo_full_name || shipperData.company_name,
              nationalId: shipperData.ceo_national_id || shipperData.national_company_id,
              companyName: shipperData.company_name,
              shipperCompany: {
                shipperType: shipperData.shipper_type || 'LEGAL_ENTITY',
                companyName: shipperData.company_name,
                companyType: shipperData.company_type || 'سهامی خاص',
                nationalCompanyId: shipperData.national_company_id || '',
                registrationNumber: shipperData.registration_number || '',
                economicCode: shipperData.economic_code || '',
                establishmentDate: shipperData.establishment_date || '',
                industrySector: shipperData.industry_sector || '',
                monthlyFreightVolumeTons: String(shipperData.monthly_freight_volume_tons || ''),
                preferredTruckTypes: shipperData.preferred_truck_types || [],
                ceoFullName: shipperData.ceo_full_name || '',
                ceoNationalId: shipperData.ceo_national_id || '',
                ceoMobile: shipperData.ceo_mobile || '',
                landlinePhone: shipperData.landline_phone || '',
                website: shipperData.website || '',
              },
              shipperLocations: {
                officeProvince: shipperData.office_province || 'تهران',
                officeCity: shipperData.office_city || 'تهران',
                officePostalCode: shipperData.office_postal_code || '',
                officeAddress: shipperData.office_address || '',
                warehouseProvince: shipperData.warehouse_province || 'تهران',
                warehouseCity: shipperData.warehouse_city || 'تهران',
                warehouseAddress: shipperData.warehouse_address || '',
                warehouseContactPerson: shipperData.warehouse_contact_person || '',
                warehouseContactPhone: shipperData.warehouse_contact_phone || '',
                warehouseFacilities: shipperData.warehouse_facilities || [],
              },
              shipperBank: {
                bankName: shipperData.bank_name || '',
                iban: shipperData.bank_iban || '',
                accountNumber: shipperData.bank_account_number || '',
                bankBranch: shipperData.bank_branch || '',
                accountHolderName: shipperData.account_holder_name || '',
                termsConfirmed: true,
              },
              shipperDocuments: docsMap,
              registrationStep: shipperData.registration_step || 5,
            };
          }
        } catch (e) {
          console.warn('Supabase fetch shipper profile error:', e);
        }
      }
    }
    return null;
  }
}

function mockDriverBidsBidsMap(): Record<string, ShipperDriverCandidate[]> {
  return mockDriverBidsForCargo;
}

export const shipperService = new ShipperServiceStore();
