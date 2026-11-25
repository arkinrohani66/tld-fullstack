export type UserRole = 'DRIVER' | 'SHIPPER' | 'ADMIN';

export type VerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'RESUBMIT_REQUIRED';

export type Language = 'fa' | 'en' | 'tr';

export type AppScreen =
  | 'SPLASH'
  | 'ONBOARDING'
  | 'LANGUAGE'
  | 'LOGIN'
  | 'SIGNUP'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD'
  | 'OTP'
  | 'ROLE_SELECTION'
  | 'DRIVER_REGISTRATION'
  | 'SHIPPER_REGISTRATION'
  | 'VERIFICATION_STATUS'
  | 'DRIVER_DASHBOARD'
  | 'SHIPPER_DASHBOARD'
  | 'NOTIFICATIONS'
  | 'NOTIFICATION_DETAIL'
  | 'MESSAGES'
  | 'CHAT'
  | 'CARGOS'
  | 'TRIPS'
  | 'WALLET'
  | 'PROFILE'
  | 'EDIT_PROFILE'
  | 'CHANGE_PASSWORD'
  | 'SETTINGS'
  | 'TRANSACTIONS'
  // Driver Flow (Section B) Dedicated Screens
  | 'DRIVER_VEHICLE'
  | 'DRIVER_BIDS'
  | 'DRIVER_ACTIVE_TRIP'
  | 'DRIVER_TRIP_HISTORY'
  | 'DRIVER_EARNINGS'
  | 'DRIVER_RATINGS'
  | 'DRIVER_DISPUTES'
  // Shipper Flow (Section C) Dedicated Screens
  | 'SHIPPER_CREATE_CARGO'
  | 'SHIPPER_ACTIVE_CARGOS'
  | 'SHIPPER_PAST_CARGOS'
  | 'SHIPPER_BIDS'
  | 'SHIPPER_CONTRACT'
  | 'SHIPPER_ESCROW'
  | 'SHIPPER_TRACKING'
  | 'SHIPPER_DELIVERY_CONFIRM'
  | 'SHIPPER_INVOICE'
  | 'SHIPPER_RATING'
  | 'SHIPPER_DISPUTES'
  // TLD Advanced Tracking & IoT Center
  // Advanced Freight Modules
  | 'DRIVER_BACKHAUL'
  | 'RMTO_WAYBILL_VERIFY'
  | 'ADMIN_DASHBOARD';

export interface DriverDocuments {
  nationalCardFront?: string;
  nationalCardBack?: string;
  driverLicense?: string;
  personalPhoto?: string;
  smartCard?: string;
  healthCard?: string;
  birthCertificate?: string;
  selfie?: string;
}

export interface DriverTruckInfo {
  type: string;
  brand: string;
  model: string;
  color: string;
  engineNumber: string;
  axles: string;
  platePart1: string;
  plateLetter: string;
  platePart2: string;
  plateIranCode: string;
  capacityTons: string;
  buildYear: string;
  chassisNumber?: string;
  documents?: {
    truckCard?: string;
    greenSheet?: string;
    insurance?: string;
    technicalInspection?: string;
    smartCardTruck?: string;
    frontPhoto?: string;
    rearPhoto?: string;
  };
}

export interface DriverBankInfo {
  iban: string;
  cardNumber: string;
  accountHolderName: string;
  cardImage?: string;
  termsConfirmed: boolean;
}

export type ShipperType = 'LEGAL_ENTITY' | 'INDIVIDUAL';

export interface ShipperCompanyInfo {
  shipperType: ShipperType;
  companyName: string;
  companyType: string;
  nationalCompanyId: string;
  registrationNumber: string;
  economicCode: string;
  establishmentDate: string;
  industrySector: string;
  monthlyFreightVolumeTons: string;
  preferredTruckTypes: string[];
  ceoFullName: string;
  ceoNationalId: string;
  ceoMobile: string;
  landlinePhone: string;
  website?: string;
}

export interface ShipperLocationsInfo {
  officeProvince: string;
  officeCity: string;
  officePostalCode: string;
  officeAddress: string;
  warehouseProvince: string;
  warehouseCity: string;
  warehouseAddress: string;
  warehouseContactPerson: string;
  warehouseContactPhone: string;
  warehouseFacilities: string[];
}

export interface ShipperDocuments {
  officialGazette?: string;
  vatCertificate?: string;
  businessLicense?: string;
  companyArticles?: string;
  nationalCardCeoFront?: string;
  nationalCardCeoBack?: string;
  authorizationLetter?: string;
  bankIbanConfirmation?: string;
  factoryOwnershipLease?: string;
  signatureSpecimen?: string;
}

export interface ShipperBankInfo {
  bankName: string;
  iban: string;
  accountNumber: string;
  bankBranch: string;
  accountHolderName: string;
  termsConfirmed: boolean;
}

export interface UserProfile {
  fullName: string;
  firstName?: string;
  lastName?: string;
  nationalId: string;
  email?: string;
  dob: string;
  province?: string;
  city?: string;
  postalCode?: string;
  address: string;
  mobile?: string;
  driverId?: string;
  profileImage?: string;
  companyName?: string;
  fleetType?: string;
  truckModel?: string;
  plateNumber?: string;
  driverDocuments?: DriverDocuments;
  driverTruck?: DriverTruckInfo;
  driverBank?: DriverBankInfo;
  shipperCompany?: ShipperCompanyInfo;
  shipperLocations?: ShipperLocationsInfo;
  shipperDocuments?: ShipperDocuments;
  shipperBank?: ShipperBankInfo;
  registrationStep?: number;
}

export interface UserAccount {
  id: string;
  mobile: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  profile?: UserProfile;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  requestId: string;
  submittedAt?: string;
  createdAt: string;
}

export type DataComponentState =
  | 'LIVE'
  | 'UPDATING'
  | 'STALE'
  | 'OFFLINE'
  | 'NO_DATA'
  | 'ERROR'
  | 'WARNING'
  | 'CRITICAL';

export interface SensorReading<T = string | number> {
  value: T;
  unit: string;
  status: DataComponentState;
  timestamp: string;
  source: string;
  label?: string;
}

export interface VehicleTelemetry {
  vehicleId: string;
  speed: SensorReading<number>;
  gps: SensorReading<{ lat: number; lng: number; address: string }>;
  eta: SensorReading<string>;
  distanceRemaining: SensorReading<number>;
  cargoWeight: SensorReading<number>;
  temperature: SensorReading<number>;
  battery: SensorReading<number>;
  network: SensorReading<string>;
  smartLock: SensorReading<'LOCKED' | 'UNLOCKED'>;
  sensorHealth: SensorReading<number>;
}

// Notification System Types
export type NotificationCategory = 'ALL' | 'CARGO' | 'TRIP' | 'FINANCIAL' | 'SYSTEM' | 'SECURITY';
export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  isRead: boolean;
  entityId?: string;
  entityType?: 'CARGO' | 'TRIP' | 'PAYMENT' | 'SENSOR' | 'WALLET' | 'SYSTEM' | 'SECURITY';
  eta?: string;
  statusText?: string;
  statusColor?: string;
  detailedDescription?: string;
  tldBoxId?: string;
  temperature?: string;
  threshold?: string;
  sectionDate?: 'TODAY' | 'YESTERDAY' | 'OLDER';
}

// Messaging & Chat System Types
export type MessageDeliveryStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: 'DRIVER' | 'SHIPPER' | 'DISPATCHER' | 'SYSTEM';
  text: string;
  imageUrl?: string;
  telemetrySnapshot?: {
    speed: number;
    weight: number;
    temperature: number;
    timestamp: string;
  };
  timestamp: string;
  status: MessageDeliveryStatus;
  isOutgoing: boolean;
  isSystemAlert?: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  participantAvatar: string;
  onlineStatus: 'ONLINE' | 'BUSY' | 'OFFLINE';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  cargoId?: string;
  statusType?: 'NORMAL' | 'WARNING' | 'OFFLINE';
  isPinned?: boolean;
}

// Logistics Core Types
export interface CargoItem {
  id: string;
  title: string;
  origin: string;
  destination: string;
  status: 'IN_TRANSIT' | 'PENDING_DRIVER' | 'DRIVER_ASSIGNED' | 'DELIVERED' | 'LOADING' | 'CANCELLED';
  eta: string;
  weight: string;
  truckType: string;
  price: string;
  postedTime?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  driverTruck?: string;
  driverAvatar?: string;
  progressPercentage?: number;
  temperature?: string;
  smartLockStatus?: 'LOCKED' | 'UNLOCKED';
  // Real database fields (public.cargos)
  agreedFareTomans?: number;
  assignedDriverId?: string;
  weightTons?: number;
}

export interface TripItem {
  id: string;
  cargoId: string;
  origin: string;
  destination: string;
  departureTime: string;
  eta: string;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  currentSpeedKmH: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULED' | 'DELAYED';
  vehicleId: string;
  progressPercentage: number;
}

export interface WalletTransaction {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  relatedEntityId?: string;
}

// ==========================================
// SECTION B: DRIVER FLOW DATA STRUCTURES
// ==========================================

// 1. Vehicle Management & Live Telemetry
export interface RegisteredVehicle {
  id: string;
  driverId: string;
  truckType: string; // کفی، چادری، یخچالی، کمپرسی، تانکر
  brand: string; // ولوو، اسکانیا، مرسدس بنز، فاو، داف
  model: string; // FH 500, R450, Actros, etc.
  buildYear: string;
  color: string;
  plateNumber: string; // e.g. "۱۲ ع ۳۴۵ ایران ۶۸"
  platePart1: string;
  plateLetter: string;
  platePart2: string;
  plateIranCode: string;
  chassisNumber?: string;
  engineNumber?: string;
  smartCardTruck?: string;
  capacityTons: number;
  volumeM3?: number;
  axles: number;
  isPrimary: boolean;
  isActive: boolean;
  // Smart Box & Sensor Telemetry
  smartBoxId: string;
  smartLockStatus: 'LOCKED' | 'UNLOCKED';
  currentSpeedKmH: number;
  cargoTemperature: number;
  ambientHumidity: number;
  batteryHealthPercent: number;
  fuelLevelPercent: number;
  tirePressureBar: number;
  lastSyncTime: string;
}

// 2. Cargo Bidding & Negotiation
export type BidStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTER_OFFER'
  | 'CANCELLED'
  | 'EXPIRED';

export interface CargoBidItem {
  id: string;
  cargoId: string;
  cargoTitle: string;
  originCity: string;
  destinationCity: string;
  originalPrice: string;
  proposedFareAmount: number;
  proposedFareFormatted: string;
  readyToLoadTime: string;
  driverNotes?: string;
  status: BidStatus;
  counterOfferAmount?: number;
  counterOfferFormatted?: string;
  counterOfferNote?: string;
  submittedAt: string;
  expiresAt: string;
  shipperName: string;
  shipperRating: number;
  cargoWeight: string;
  truckTypeRequired: string;
  // Driver identity joined from profiles/drivers
  driverFullName?: string;
  driverAvatarUrl?: string;
  driverRatingScore?: number;
  driverTotalTrips?: number;
  driverOnTimeRate?: number;
  driverPlateNumber?: string;
  driverTruckModel?: string;
  driverFleetType?: string;
}

// 3. Active Trip Loading & Discharge Checkpoints
export type TripMilestoneStage =
  | 'ARRIVED_ORIGIN'
  | 'LOADING_STARTED'
  | 'CARGO_SECURED'
  | 'WAYBILL_SEALED'
  | 'IN_TRANSIT'
  | 'ARRIVED_DEST'
  | 'SMART_LOCK_RELEASED'
  | 'UNLOADED'
  | 'DIGITAL_POD_SIGNED';

export interface TripCheckpointItem {
  id: string;
  stage: TripMilestoneStage;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  actorRole?: string;
  otpCode?: string;
  smartSealCode?: string;
  photoUrl?: string;
  signatureUrl?: string;
}

// 4. Driver Earnings & Settlement
export interface DriverEarningRecord {
  id: string;
  tripId: string;
  cargoTitle: string;
  originCity: string;
  destinationCity: string;
  grossFare: number;
  commission: number;
  tollDeduction: number;
  netEarnings: number;
  date: string;
  status: 'PAID' | 'AVAILABLE_FOR_CASHOUT' | 'PENDING_ESCROW';
}

export interface DriverSettlementRecord {
  id: string;
  referenceCode: string;
  amount: number;
  amountFormatted: string;
  iban: string;
  bankName: string;
  transferType: 'INSTANT_CARD' | 'PAYA' | 'SATNA';
  status: 'SUCCESS' | 'PENDING' | 'PROCESSING';
  trackingCode: string;
  requestedAt: string;
  settledAt?: string;
}

// 5. Driver Ratings & Performance
export interface DriverRatingStats {
  averageRating: number;
  totalReviews: number;
  onTimeDeliveryRate: number;
  safetyScore: number;
  cargoIntegrityScore: number;
  completedTripsCount: number;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER';
  reviews: DriverReview[];
}

export interface DriverReview {
  id: string;
  shipperName: string;
  shipperCompany: string;
  rating: number;
  date: string;
  comment: string;
  tripRoute: string;
  tags: string[];
  cargoType?: string;
  waybillNumber?: string;
  driverResponse?: string;
  responseDate?: string;
  ratingBreakdown?: {
    punctuality: number;
    cargoCare: number;
    professionalism: number;
    vehicleCondition: number;
  };
}

// 6. Driver Dispute & Claim Management
export type DisputeType =
  | 'DEMURRAGE_CLAIM' // حق توقف بیش از حد در بارگیری/تخلیه
  | 'UNPAID_FARE' // عدم پرداخت کرایه
  | 'CARGO_DAMAGE' // آسیب‌دیدگی محموله
  | 'ROUTE_ACCIDENT_SOS' // سانحه جاده‌ای یا نقص فنی
  | 'SHIPPER_DISAGREEMENT' // اختلاف در تناژ یا مفاد قرارداد
  | 'OTHER';

export type DisputeStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESOLVED_WITH_PAYOUT';

export interface DriverDisputeItem {
  id: string;
  disputeType: DisputeType;
  title: string;
  tripId?: string;
  cargoTitle?: string;
  description: string;
  claimedAmount: number;
  claimedAmountFormatted: string;
  status: DisputeStatus;
  evidencePhotos: string[];
  submittedAt: string;
  arbitrationNote?: string;
  resolutionAmount?: number;
}

// ==========================================
// SECTION C: SHIPPER FLOW DATA STRUCTURES
// ==========================================

// 1. Full Cargo Registration Model & Steps
export interface CargoOriginDetails {
  province: string;
  city: string;
  industrialPark?: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  loadingDate: string; // e.g. "۱۴۰۳/۰۶/۱۵"
  loadingTimeWindow: string; // e.g. "۰۸:۰۰ الی ۱۲:۰۰"
  loadingFacilities: string[]; // ['لیفتراک', 'جرثقیل سقفی', 'کارگر بارچین', 'رمپ اختصاصی']
  coordinates?: { lat: number; lng: number };
}

export interface CargoDestinationDetails {
  province: string;
  city: string;
  warehouseName?: string;
  address: string;
  receiverName: string;
  receiverPhone: string;
  unloadingDate: string;
  unloadingTimeWindow: string;
  unloadingFacilities: string[];
  coordinates?: { lat: number; lng: number };
}

export type CargoCategory =
  | 'METALS_INDUSTRIAL' // فولاد، آهن‌آلات و تجهیزات صنعتی
  | 'FOOD_PERISHABLE' // مواد غذایی، لبنی و فاسدشدنی
  | 'AGRICULTURE' // غلات، علوفه و محصولات کشاورزی
  | 'PETROCHEMICAL' // مواد پلیمری، شیمیایی و مشتقات نفتی
  | 'BUILDING_MATERIALS' // سیمان، کاشی، سرامیک، سنگ و آجر
  | 'COMMERCIAL_GOODS' // کالاهای مصرفی، لوازم خانگی و تجاری
  | 'OVERSIZED_SPECIAL'; // کالای ترافیکی و فوق‌سنگین

export type PackagingType =
  | 'PALLET' // پالت استاندارد
  | 'BULK' // فله
  | 'JUMBO_BAG' // کیسه جامبوبگ
  | 'BOX_CARTON' // کارتن و بسته
  | 'DRUM_BARREL' // بشکه
  | 'COIL_ROLL' // رول و کویل فولادی
  | 'WOODEN_CRATE'; // جعبه چوبی صنعتی

export interface CargoPhysicalSpecs {
  title: string;
  category: CargoCategory;
  declaredValueTomans: number; // ارزش اظهاری کالا جهت بیمه
  packaging: PackagingType;
  weightTons: number;
  volumeM3?: number;
  dimensions?: {
    lengthM: number;
    widthM: number;
    heightM: number;
  };
  temperatureRequired?: {
    isTemperatureControlled: boolean;
    targetTempCelsius?: number; // e.g. -18 or +4
    tempRange?: string; // e.g. "منفی ۱۸ تا منفی ۲۲"
  };
  requiresSmartLock: boolean;
  requiresLashingStraps: boolean;
  specialInstructions?: string;
}

export interface FleetRequirement {
  truckCategory: 'TRAILER' | 'RIGID' | 'LIGHT' | 'SPECIAL';
  truckTypeName: string; // e.g. "تریلی کفی", "ترانزیت چادری", "تریلی یخچالی", "کامیون جفت ۱۰ چرخ"
  bodyType: 'FLATBED' | 'CURTAIN_SIDER' | 'REFRIGERATED' | 'TIPPER' | 'TANKER' | 'CLOSED_BOX';
  minCapacityTons: number;
  loadingFrom: 'TOP' | 'REAR' | 'SIDE' | 'ANY'; // بارگیری از بالا، عقب، بغل
}

export interface SmartPricingEstimate {
  baseTonKmRate: number; // نرخ مصوب تن-کیلومتر
  distanceKm: number; // مسافت جاده‌ای
  aiRecommendedFareTomans: number; // نرخ هوشمند بر اساس عرضه و تقاضا
  marketMinFareTomans: number;
  marketMaxFareTomans: number;
  fuelTollFactor: number; // ضریب سوخت و عوارض
  weatherTrafficFactor: number; // ضریب شرایط جوی
  pricingMode: 'AI_SUGGESTED' | 'FIXED_PRICE' | 'BIDDING_AUCTION';
  finalOfferedFareTomans: number; // کرایه نهایی پیشنهادی صاحب بار
}

export interface CargoInsuranceSelection {
  underwriter: 'بیمه ایران' | 'بیمه دانا' | 'بیمه البرز' | 'بیمه آسیا';
  coverageType: 'ALL_RISKS_CLAUSE_A' | 'ACCIDENT_FIRE_CLAUSE_B' | 'TOTAL_LOSS_CLAUSE_C';
  declaredValueTomans: number;
  premiumRatePercent: number; // e.g. 0.05%
  calculatedPremiumTomans: number;
  deductiblePercent: number; // فرانشیز e.g. 10%
  policyNumber?: string;
  isIssued: boolean;
}

export type ShipperCargoStatus =
  | 'DRAFT'
  | 'PENDING_DRIVER' // منتشر شده، در انتظار تایید راننده
  | 'IN_NEGOTIATION' // در حال بررسی و مقایسه پیشنهادها
  | 'DRIVER_ASSIGNED' // راننده انتخاب شد، در انتظار عقد قرارداد
  | 'CONTRACT_SIGNED' // قرارداد دیجیتال امضا شد
  | 'ESCROW_FUNDED' // کرایه در حساب امانی شاپرک شارژ شد
  | 'LOADING' // راننده در مبدا، در حال بارگیری و پلمپ
  | 'WAYBILL_ISSUED' // بارنامه رسمی راهداری صادر شد
  | 'IN_TRANSIT' // در مسیر جاده به همراه رهگیری آنلاین
  | 'ARRIVED_DESTINATION' // به مقصد رسید، آماده تخلیه
  | 'DELIVERED_CONFIRMED' // تخلیه تایید شد، امضای تحویل ثبت شد
  | 'SETTLED' // تسویه حساب کامل با راننده و صدور فاکتور
  | 'CANCELLED'
  | 'DISPUTED';

export interface ShipperFullCargo {
  id: string;
  cargoNumber: string; // e.g. "CRG-9842"
  createdAt: string;
  status: ShipperCargoStatus;
  origin: CargoOriginDetails;
  destination: CargoDestinationDetails;
  cargoInfo: CargoPhysicalSpecs;
  fleetReq: FleetRequirement;
  pricing: SmartPricingEstimate;
  insurance: CargoInsuranceSelection;
  assignedDriver?: ShipperDriverCandidate;
  assignedDriverId?: string;
  activeTripId?: string;
  contractId?: string;
  waybillId?: string;
  escrowStatus?: 'UNPAID' | 'HELD_IN_ESCROW' | 'RELEASED' | 'DISPUTED';
  bidsCount: number;
}

// 2. Driver Candidates & Bids for Shipper
export interface ShipperDriverCandidate {
  driverId: string;
  fullName: string;
  avatarUrl?: string;
  mobile: string;
  nationalIdMasked: string;
  smartCardNumber: string;
  ratingScore: number;
  tierBadge: 'DIAMOND' | 'GOLD' | 'SILVER';
  totalCompletedTrips: number;
  onTimeDeliveryRate: number;
  cargoIntegrityRate: number;
  truckBrand: string;
  truckModel: string;
  truckType: string;
  truckBuildYear: string;
  plateNumber: string;
  etaToOriginMinutes: number;
  currentDistanceKm: number;
  proposedFareTomans: number;
  fareFormatted: string;
  driverNote?: string;
  bidSubmittedAt: string;
  healthCardValid: boolean;
  insuranceValid: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  recentReviews?: {
    shipperName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

// 3. Digital Smart Contract
export interface DigitalSmartContract {
  contractNumber: string;
  cargoId: string;
  cargoTitle: string;
  shipperName: string;
  shipperCompany: string;
  shipperNationalId: string;
  driverName: string;
  driverNationalId: string;
  driverSmartCard: string;
  truckPlate: string;
  originAddress: string;
  destinationAddress: string;
  agreedFareTomans: number;
  escrowPaymentRef: string;
  demurrageRatePerHourTomans: number; // نرخ حق توقف ساعتی
  loadingTimeAllowanceHours: number; // مهلت مجاز بارگیری
  unloadingTimeAllowanceHours: number; // مهلت مجاز تخلیه
  penaltyPerDayDelayTomans: number; // جریمه تاخیر در تحویل روزانه
  insurancePolicyNumber: string;
  insuranceUnderwriter: string;
  termsAndConditions: string[];
  shipperSignatureDate?: string;
  driverSignatureDate?: string;
  shipperSignatureDataUrl?: string;
  driverSignatureDataUrl?: string;
  isFullyExecuted: boolean;
  legalHash: string; // بلاکچین/هش یکتای امنیتی
}

// 4. Electronic Waybill (بارنامه الکترونیک راهداری RMTO)
export interface ElectronicWaybill {
  waybillNumber: string;
  rmtoTrackingCode: string; // کد رهگیری سازمان راهداری و حمل و نقل جاده‌ای
  issuedDate: string;
  originTerminal: string;
  destinationTerminal: string;
  shipperFullName: string;
  receiverFullName: string;
  driverFullName: string;
  driverNationalCode: string;
  driverLicenseNumber: string;
  driverSmartCard: string;
  truckPlateNumber: string;
  truckSmartCard: string;
  cargoDescription: string;
  netWeightTons: number;
  grossWeightTons: number;
  fareAmountTomans: number;
  commissionTomans: number;
  terminalFeeTomans: number;
  roadTollTomans: number;
  insuranceFeeTomans: number;
  qrCodeUrl: string;
  barcodeNumber: string;
  status: 'ACTIVE_VALID' | 'DISCHARGED' | 'CANCELLED';
}

// 5. Escrow Account & Payment Gateway
export interface EscrowAccountDetails {
  escrowId: string;
  cargoId: string;
  totalHoldAmountTomans: number;
  breakdown: {
    driverNetFare: number;
    platformCommission: number;
    insurancePremium: number;
    taxAndVat: number;
  };
  status: 'AWAITING_DEPOSIT' | 'HELD_SECURE' | 'RELEASED_TO_DRIVER' | 'REFUNDED' | 'FROZEN_DISPUTE';
  gatewayTransactionRef?: string;
  fundedAt?: string;
  releasedAt?: string;
  releaseOtpCode?: string;
}

// 6. Live IoT Tracking & Sensors
export interface LiveTelemetrySnapshot {
  cargoId: string;
  driverId: string;
  currentLat: number;
  currentLng: number;
  currentAddress: string;
  currentSpeedKmH: number;
  speedLimitKmH: number;
  estimatedRemainingKm: number;
  estimatedRemainingMinutes: number;
  temperatureCelsius?: number;
  targetTempCelsius?: number;
  ambientHumidityPercent?: number;
  smartLockStatus: 'LOCKED_SEALED' | 'UNLOCKED_ALARM' | 'AUTHORIZED_UNLOCKED';
  smartSealCode: string;
  batteryLevelPercent: number;
  networkSignal: '5G' | '4G' | 'SATELLITE' | 'WEAK';
  lastUpdated: string;
  isOffRoute: boolean;
  routeCheckpoints: {
    title: string;
    location: string;
    passed: boolean;
    passedTime?: string;
  }[];
}

// 7. Delivery Proof & POD (Proof of Delivery)
export interface DeliveryProofPOD {
  cargoId: string;
  cargoNumber: string;
  receiverName: string;
  receiverMobile: string;
  deliveredAt: string;
  unloadingAddress: string;
  receiverOtpCodeEntered: string;
  receiverSignatureDataUrl: string;
  goodsConditionNotes: string;
  deliveredPhotos: string[];
  weighbridgeDischargeSlipNumber?: string;
  isAcceptedWithoutReservation: boolean;
}

// 8. Official Tax Invoice (صورتحساب الکترونیکی مودیان)
export interface OfficialTaxInvoice {
  invoiceNumber: string;
  taxUniqueId: string; // شناسه یکتای مالیاتی ۲۲ رقمی
  issueDate: string;
  fiscalPeriod: string;
  sellerInfo: {
    legalName: string;
    economicCode: string;
    nationalId: string;
    postalCode: string;
    address: string;
    phone: string;
  };
  buyerInfo: {
    fullNameOrCompany: string;
    economicCode?: string;
    nationalId: string;
    postalCode: string;
    address: string;
    phone: string;
  };
  itemDescription: string;
  cargoNumber: string;
  route: string;
  netFareTomans: number;
  serviceFeeTomans: number;
  insuranceTomans: number;
  subtotalTomans: number;
  vat9PercentTomans: number;
  totalPayableTomans: number;
  paymentMethod: 'ESCROW_SETTLED_SHAPARAK';
  paymentTrackingRef: string;
  qrVerificationUrl: string;
}

// 9. Shipper Dispute / Claim
export interface ShipperDisputeRecord {
  id: string;
  cargoId: string;
  cargoNumber: string;
  driverName: string;
  disputeType:
    | 'CARGO_DAMAGE'
    | 'CARGO_SHORTAGE'
    | 'DELAY_DEMURRAGE'
    | 'TEMPERATURE_DEVIATION'
    | 'DRIVER_OVERCHARGE'
    | 'UNAUTHORIZED_UNSEAL'
    | 'OTHER';
  title: string;
  description: string;
  claimedLossTomans: number;
  evidencePhotoUrls: string[];
  status: 'REGISTERED' | 'INSURANCE_INVESTIGATION' | 'ARBITRATION_PANEL' | 'SETTLED_COMPENSATION' | 'REJECTED';
  submittedAt: string;
  arbitrationVerdict?: string;
  compensatedAmountTomans?: number;
}

// ==========================================
// SECTION D: TLD ADVANCED TRACKING & IoT SUITE
// ==========================================

export interface TLDBoxDeviceInfo {
  boxSerialNumber: string; // e.g. "TLD-PRO-9842-IR"
  model: string; // "TLD-PRO Gen 4 Heavy Fleet IoT Hub"
  firmwareVersion: string; // "v4.8.2-OTA-STABLE"
  imeiNumber: string; // "864920194820194"
  hardwareStatus: 'OPTIMAL' | 'DEGRADED' | 'WARNING' | 'TAMPER_ALERT';
  primarySimCarrier: 'همراه اول 5G M2M' | 'ایرانسل LTE-M' | 'رایتل';
  satelliteBackupStatus: 'ONLINE_IRIDIUM' | 'STANDBY' | 'ACQUIRING';
  batteryCapacityMah: number; // 18000 mAh
  batteryLevelPercent: number; // 96%
  isSolarCharging: boolean;
  solarInputWatts: number; // e.g. 4.8W
  externalPowerVoltage: number; // 24.2V truck alternator
  internalStorageRemainingMb: number; // 3200 MB
  lastHeartbeatTime: string;
  uptimeHours: number;
  tamperSwitchTriggered: boolean;
  opticalLightSensorLux: number; // Light detection inside dark container
  ipRating: 'IP69K_WATERPROOF';
}

export interface TLDSensorMetrics {
  // GPS & Dynamics
  currentLat: number;
  currentLng: number;
  altitudeMeters: number;
  headingDegrees: number;
  currentSpeedKmH: number;
  speedLimitKmH: number;
  instantGForce: number;
  harshBrakingDetected: boolean;
  rapidAccelDetected: boolean;
  // Multi-Zone Temperature (°C)
  tempZone1Front: number; // Near refrigeration unit
  tempZone2Middle: number; // Cargo center
  tempZone3Rear: number; // Near back doors
  tempAmbientExternal: number; // Outside road temp
  targetTempCelsius: number;
  minAllowedTempCelsius: number;
  maxAllowedTempCelsius: number;
  // Load Cell & Weight (Tons)
  grossTotalWeightTons: number;
  netCargoWeightTons: number;
  steerAxleWeightTons: number;
  driveTandemWeightTons: number;
  trailerTriAxleWeightTons: number;
  loadBalanceDeviationPercent: number; // Centered cargo check
  isWeightAnomalyDetected: boolean;
  // Environmental & Security
  relativeHumidityPercent: number;
  barometricPressureHpa: number;
  eLockStatus: 'LOCKED_SEALED' | 'AUTHORIZED_UNLOCKED' | 'TAMPER_BREACH';
  eLockCableLoopResistanceOhms: number; // Normal ~12 ohms; cut = infinity
  doorOpenSensor: 'DOOR_CLOSED' | 'DOOR_AJAR' | 'DOOR_WIDE_OPEN';
  // ETA & Routing
  originCity: string;
  destinationCity: string;
  totalJourneyKm: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  etaTimeFormatted: string;
  etaRemainingMinutes: number;
  isOffGeofenceRoute: boolean;
  geofenceDeviationMeters: number;
}

export interface TLDTelemetryHistoricalPoint {
  id: string;
  timestamp: string;
  hourLabel: string;
  speedKmH: number;
  tempZone1: number;
  tempZone2: number;
  tempZone3: number;
  weightTons: number;
  shockG: number;
  batteryPct: number;
  locationName: string;
  hasIncidentAlert: boolean;
  incidentType?: string;
}

export type TLDAlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type TLDAlertCategory =
  | 'TEMP_BREACH'
  | 'WEIGHT_DROP'
  | 'ROUTE_DEVIATION'
  | 'E_LOCK_TAMPER'
  | 'DOOR_OPEN'
  | 'HARSH_IMPACT'
  | 'SPEEDING'
  | 'BATTERY_LOW';

export interface TLDSmartAlert {
  id: string;
  category: TLDAlertCategory;
  severity: TLDAlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  sensorValue: string;
  thresholdValue: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  actionTaken?: string;
  locationAddress: string;
  coordinates: { lat: number; lng: number };
  emergencyContactDispatched: boolean;
}

export interface TLDAlertRuleConfig {
  tempMinCelsius: number;
  tempMaxCelsius: number;
  maxSpeedKmH: number;
  weightLossToleranceKg: number;
  geofenceToleranceMeters: number;
  shockImpactThresholdG: number;
  doorOpenAllowedSeconds: number;
  smsAlertsEnabled: boolean;
  emergencySosEnabled: boolean;
}

// ==========================================
// Fuel IoT Telemetry & Eco-Driving Types
// ==========================================

export type FuelSensorType = 'ULTRASONIC_DIGITAL_CAN' | 'CAPACITIVE_RS485' | 'OBD_CANBUS_FLOW';

export interface FuelIoTTelemetry {
  truckPlate: string;
  truckModel: string;
  tankCapacityLiters: number;
  currentFuelLiters: number;
  fuelPercentage: number;
  instantLitersPer100Km: number;
  averageLitersPer100Km: number;
  fleetBenchmarkL100Km: number;
  instantFuelFlowMlPerSec: number;
  instantLitersPerHour: number;
  fuelTempCelsius: number;
  engineRpm: number;
  engineLoadPercent: number;
  throttlePedalPercent: number;
  vehicleSpeedKmH: number;
  idlingTimeMinutes: number;
  idlingFuelWastedLiters: number;
  cruisingRatioPercent: number;
  co2EmissionsKgPer100Km: number;
  tankSensorType: FuelSensorType;
  connectionStatus: 'LIVE_STREAMING' | 'BUFFERED_REPLAY' | 'STANDBY';
  lastUpdated: string;
  tamperDetected: boolean;
}

export interface DriverEcoMetrics {
  driverName: string;
  ecoScore: number; // 0 - 100
  ecoTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
  smoothAccelScore: number;
  anticipationBrakingScore: number;
  speedDisciplineScore: number;
  gearShiftOptScore: number;
  idleManagementScore: number;
  monthlyRewardToman: number;
  tripFuelSavedLiters: number;
  fuelCostSavedDriverToman: number;
  feedbackTips: Array<{
    id: string;
    type: 'success' | 'warning' | 'info';
    title: string;
    advice: string;
  }>;
  efficiencyTrendHourly: Array<{
    time: string;
    l100km: number;
    speed: number;
    rpm: number;
    ecoScore: number;
  }>;
  efficiencyTrendDays: Array<{
    day: string;
    l100km: number;
    litersSaved: number;
    ecoScore: number;
  }>;
}

export interface ShipperFuelSavings {
  totalTripSavingsToman: number;
  percentageCostReduction: number;
  savedFuelLiters: number;
  co2ReductionKg: number;
  costPerTonKmToman: number;
  baselineCostPerTonKmToman: number;
  baselineTripCostToman: number;
  optimizedTripCostToman: number;
  dieselPricePerLiterToman: number;
  cargosFuelAnalytics: Array<{
    cargoId: string;
    title: string;
    origin: string;
    destination: string;
    distanceKm: number;
    weightTons: number;
    baselineLiters: number;
    actualLiters: number;
    savingsToman: number;
    ecoStatus: string;
  }>;
}

export type FuelAnomalyType =
  | 'FUEL_THEFT_SUSPECT'
  | 'RAPID_DRAIN'
  | 'HIGH_IDLE_WASTE'
  | 'AGGRESSIVE_THROTTLE'
  | 'REFUELING_LOGGED';

export interface FuelAnomalyAlert {
  id: string;
  type: FuelAnomalyType;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  timestamp: string;
  location: string;
  volumeDeltaLiters: number;
  message: string;
  resolved: boolean;
}

export interface RefuelingEvent {
  id: string;
  date: string;
  stationName: string;
  location: string;
  litersAdded: number;
  pricePerLiterToman: number;
  totalCostToman: number;
  odometerKm: number;
  receiptNumber: string;
  gpsVerified: boolean;
}




