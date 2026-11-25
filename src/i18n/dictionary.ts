import { Language } from '../types';

export interface TranslationDictionary {
  // Common Labels & Actions
  appName: string;
  appTitle: string;
  slogan: string;
  start: string;
  skip: string;
  next: string;
  back: string;
  continue: string;
  save: string;
  cancel: string;
  confirm: string;
  filter: string;
  search: string;
  status: string;
  scanQr: string;
  support: string;
  faq: string;
  about: string;
  contact: string;
  transactions: string;
  wallet: string;
  loading: string;
  offlineNotice: string;
  completed: string;
  inProgress: string;
  pending: string;
  active: string;
  canceled: string;
  edit: string;
  delete: string;
  viewDetails: string;
  close: string;
  refresh: string;
  success: string;
  error: string;
  info: string;
  warning: string;
  currencyTomans: string;
  currencyRials: string;
  km: string;
  hours: string;
  minutes: string;
  tons: string;

  // Language Selection
  selectLanguage: string;
  selectLanguageSub: string;
  farsi: string;
  english: string;
  turkish: string;

  // Onboarding Flow
  onboarding1Title: string;
  onboarding1Desc: string;
  onboarding2Title: string;
  onboarding2Desc: string;
  onboarding3Title: string;
  onboarding3Desc: string;
  syncingTelemetry: string;

  // Authentication & Registration
  login: string;
  loginOtp: string;
  forgotPassword: string;
  noAccount: string;
  createAccount: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  email: string;
  emailOptional: string;
  termsAgreement: string;
  terms: string;
  enterMobile: string;
  sendCode: string;
  backToLogin: string;
  needSupport: string;
  contactSupport: string;
  verifyMobile: string;
  codeSentTo: string;
  verifyAndContinue: string;
  resendCode: string;
  changeNumber: string;
  resetPasswordTitle: string;
  resetPasswordDesc: string;
  newPassword: string;
  passwordChangedSuccess: string;

  // Role Selection & Profile
  selectRole: string;
  selectRoleSubtitle: string;
  driver: string;
  driverSubtitle: string;
  shipper: string;
  shipperSubtitle: string;
  fleetAdmin: string;
  completeProfile: string;
  profileProgress: string;
  uploadPhoto: string;
  changePhoto: string;
  fullName: string;
  nationalId: string;
  dob: string;
  address: string;
  saveAndContinue: string;
  saveDraft: string;
  draftSaved: string;
  underReview: string;
  pendingReview: string;
  reviewNotice: string;
  viewDocs: string;
  approvalStages: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  requestId: string;
  submittedAt: string;
  logOut: string;
  profile: string;
  accountSettings: string;

  // Navigation & Menus
  home: string;
  dashboard: string;
  cargos: string;
  trips: string;
  activeTrip: string;
  tripHistory: string;
  vehicle: string;
  bids: string;
  earnings: string;
  ratings: string;
  disputes: string;
  messages: string;
  notifications: string;
  settings: string;
  systemSettings: string;

  // Driver Dashboard & Subscreens
  hello: string;
  verifiedDriver: string;
  diamondDriverBadge: string;
  cargoMarketplace: string;
  activeTripBtn: string;
  driverFlowHub: string;
  driverFlowHubSub: string;
  registerVehicleTitle: string;
  registerVehicleSub: string;
  myBidsTitle: string;
  myBidsSub: string;
  activeTripTitle: string;
  activeTripSub: string;
  tripHistoryTitle: string;
  tripHistorySub: string;
  earningsTitle: string;
  earningsSub: string;
  disputesTitle: string;
  disputesSub: string;
  activeVoyageLive: string;
  loadedAtOrigin: string;
  unloadWithOtp: string;
  distanceTraveled: string;
  remainingToDestination: string;
  grossFreightFare: string;
  connectedFleet: string;
  vehicleSettings: string;
  truckPlate: string;
  trailerType: string;
  iotStatus: string;
  onlineConnected: string;
  reeferTemp: string;
  viewScorecard: string;

  // Shipper Dashboard & Flow
  shipperPortalTitle: string;
  shipperPortalSub: string;
  shipperDashboardTitle: string;
  shipperDashboardDesc: string;
  shipperDocumentsBtn: string;
  legalVerified: string;
  createCargo: string;
  createCargoSub: string;
  activeCargos: string;
  activeCargosSub: string;
  compareBids: string;
  compareBidsSub: string;
  contracts: string;
  contractsSub: string;
  escrow: string;
  escrowSub: string;
  tracking: string;
  trackingSub: string;
  invoices: string;
  invoicesSub: string;
  currentCargoOps: string;
  viewAllActiveCargos: string;
  satelliteTracking: string;
  driverBidsCount: string;
  documents: string;
  escrowAndDocs: string;
  manage: string;
  escrowBlockedAmount: string;
  releaseAfterPod: string;
  digitalContractStamped: string;
  officialTaxInvoice: string;
  fileDisputeArbitration: string;
  activeDriverProposals: string;
  enterBiddingTable: string;
  tripsCount: string;
  distanceToOrigin: string;
  proposedFare: string;
  selectDriver: string;
  chat: string;

  // Cargo Hall & Marketplace
  cargoHallTitle: string;
  cargoHallSubtitle: string;
  cargoHallDesc: string;
  postCargoBtn: string;
  myActiveBidsBtn: string;
  searchPlaceholder: string;
  allFleetTypes: string;
  reeferTrailer: string;
  curtainsiderTrailer: string;
  flatbedTrailer: string;
  tipperTrailer: string;
  recommendedCargos: string;
  allCargos: string;
  readyForBids: string;
  inTransit: string;
  originLoading: string;
  destinationUnloading: string;
  weight: string;
  sendFareBid: string;
  cargoSpecifications: string;
  insuranceCoverage: string;
  downloadPdf: string;
  routeMap: string;
  bidModalTitle: string;
  fareAmountTomans: string;
  loadingReadyTime: string;
  driverNote: string;
  cancelBtn: string;
  submitOfficialBid: string;

  // Trips & Tracking Telemetry
  tripsPageTitle: string;
  tripsPageSubtitle: string;
  activeTripsTab: string;
  completedTripsTab: string;
  allTripsTab: string;
  speed: string;
  fuel: string;
  temp: string;
  checkpoints: string;
  origin: string;
  destination: string;
  currentSpeed: string;
  fuelLevel: string;
  ambientTemp: string;
  gpsCoordinates: string;
  cargoWeightConfirmed: string;
  electronicSeal: string;
  sealSecure: string;

  // Settings & Preferences
  quickAccess: string;
  securityAndData: string;
  navigationAndNetwork: string;
  notificationsAndAlerts: string;
  systemLanguage: string;
  changePassword: string;
  clearCache: string;
  highAccuracyGps: string;
  sensorAlerts: string;
  smsAlerts: string;
  pushNotifications: string;
  sound: string;
}

export const APP_DICTIONARY: Record<Language, TranslationDictionary> = {
  fa: {
    // Common
    appName: 'TLD Logistics',
    appTitle: 'سامانه هوشمند مدیریت یکپارچه لجستیک حمل و نقل سنگین',
    slogan: 'هوشمندسازی لجستیک حمل و نقل',
    start: 'شروع به کار',
    skip: 'رد شدن',
    next: 'بعدی',
    back: 'بازگشت',
    continue: 'ادامه',
    save: 'ذخیره',
    cancel: 'انصراف',
    confirm: 'تأیید',
    filter: 'فیلتر',
    search: 'جستجو',
    status: 'وضعیت',
    scanQr: 'اسکن QR کد',
    support: 'پشتیبانی',
    faq: 'سوالات متداول',
    about: 'درباره TLD',
    contact: 'تماس با ما',
    transactions: 'تراکنش‌ها',
    wallet: 'کیف پول',
    loading: 'در حال بارگذاری سیستم...',
    offlineNotice: 'اتصال به اینترنت برقرار نیست (حالت آفلاین)',
    completed: 'تکمیل شده',
    inProgress: 'در حال انجام',
    pending: 'در انتظار',
    active: 'فعال',
    canceled: 'لغو شده',
    edit: 'ویرایش',
    delete: 'حذف',
    viewDetails: 'مشاهده جزئیات',
    close: 'بستن',
    refresh: 'به‌روزرسانی',
    success: 'موفقیت‌آمیز',
    error: 'خطا',
    info: 'اطلاعیه',
    warning: 'هشدار',
    currencyTomans: 'تومان',
    currencyRials: 'ریال',
    km: 'کیلومتر',
    hours: 'ساعت',
    minutes: 'دقیقه',
    tons: 'تن',

    // Language
    selectLanguage: 'زبان سامانه را انتخاب کنید',
    selectLanguageSub: 'لطفا زبان مورد نظر خود را برای ادامه کار انتخاب نمایید.',
    farsi: 'فارسی (Persian)',
    english: 'English (انگلیسی)',
    turkish: 'Türkçe (ترکی استانبولی)',

    // Onboarding
    onboarding1Title: 'حمل و نقل سنگین، هوشمند و یکپارچه',
    onboarding1Desc: 'سیستم جامع مدیریت ناوگان برای کنترل دقیق، مسیریابی هوشمند و نظارت درلحظه بر محموله‌های سنگین.',
    onboarding2Title: 'اتصال هوشمند راننده و صاحب بار',
    onboarding2Desc: 'با استفاده از الگوریتم‌های پیشرفته، بار مناسب با مسیر و ناوگان شما در سریع‌ترین زمان ممکن پیشنهاد داده می‌شود.',
    onboarding3Title: 'مدیریت کامل، امن و یکپارچه',
    onboarding3Desc: 'از بارگیری تا تحویل، حساب امانی امن و رهگیری زنده IoT تحت کنترل شماست.',
    syncingTelemetry: 'همگام‌سازی تله‌متری',

    // Auth
    login: 'ورود به حساب',
    loginOtp: 'ورود با رمز یک‌بار مصرف (OTP)',
    forgotPassword: 'فراموشی رمز عبور؟',
    noAccount: 'حساب کاربری ندارید؟',
    createAccount: 'ایجاد حساب کاربری',
    mobileNumber: 'شماره موبایل',
    password: 'رمز عبور',
    confirmPassword: 'تکرار رمز عبور',
    firstName: 'نام',
    lastName: 'نام خانوادگی',
    email: 'ایمیل',
    emailOptional: 'ایمیل (اختیاری)',
    termsAgreement: 'سیستم را می‌پذیرم.',
    terms: 'قوانین و مقررات',
    enterMobile: 'جهت دسترسی به داشبورد و کنترل ناوگان، وارد شوید.',
    sendCode: 'شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود',
    backToLogin: 'بازگشت به صفحه ورود',
    needSupport: 'نیاز به پشتیبانی دارید؟',
    contactSupport: 'تماس با مرکز',
    verifyMobile: 'تأیید شماره موبایل',
    codeSentTo: 'کد تأیید به شماره ارسال شد:',
    verifyAndContinue: 'تأیید و ادامه',
    resendCode: 'ارسال مجدد کد',
    changeNumber: 'تغییر شماره',
    resetPasswordTitle: 'تغییر رمز عبور',
    resetPasswordDesc: 'رمز عبور جدید خود را با حداقل ۶ کاراکتر وارد نمایید.',
    newPassword: 'رمز عبور جدید',
    passwordChangedSuccess: 'رمز عبور با موفقیت به‌روزرسانی شد.',

    // Roles & Profile
    selectRole: 'انتخاب نقش کاربری',
    selectRoleSubtitle: 'لطفا نقش خود را در سیستم TLD Logistics انتخاب کنید.',
    driver: 'راننده',
    driverSubtitle: 'حمل بار و ترابری هوشمند جاده‌ای',
    shipper: 'صاحب بار',
    shipperSubtitle: 'ثبت و مدیریت سفارشات و محموله‌ها',
    fleetAdmin: 'مدیریت ناوگان',
    completeProfile: 'تکمیل پروفایل',
    profileProgress: 'پیشرفت تکمیل پروفایل',
    uploadPhoto: 'بارگذاری تصویر پروفایل',
    changePhoto: 'تغییر تصویر',
    fullName: 'نام و نام خانوادگی',
    nationalId: 'کد ملی',
    dob: 'تاریخ تولد',
    address: 'آدرس پستی',
    saveAndContinue: 'ذخیره و ادامه',
    saveDraft: 'ذخیره پیش‌نویس',
    draftSaved: 'پیش‌نویس ذخیره شد',
    underReview: 'در حال بررسی',
    pendingReview: 'در انتظار تایید',
    reviewNotice: 'مدارک شما دریافت شد و تا ۲۴ ساعت آینده توسط تیم پشتیبانی بررسی می‌شود. در صورت نیاز به اطلاعات بیشتر، از طریق پیامک به شما اطلاع داده خواهد شد.',
    viewDocs: 'مشاهده مدارک',
    approvalStages: 'مراحل تایید',
    step1: 'ثبت اطلاعات اولیه',
    step2: 'آپلود مدارک هویتی',
    step3: 'بررسی توسط کارشناس',
    step4: 'تایید نهایی و فعال‌سازی حساب',
    requestId: 'شناسه درخواست',
    submittedAt: 'زمان ثبت',
    logOut: 'خروج از حساب',
    profile: 'حساب و پروفایل',
    accountSettings: 'تنظیمات حساب کاربری',

    // Nav
    home: 'خانه',
    dashboard: 'داشبورد',
    cargos: 'سالن اعلام بار',
    trips: 'سفرها',
    activeTrip: 'سفر فعال و تخلیه',
    tripHistory: 'تاریخچه سفرها',
    vehicle: 'ثبت و مدیریت خودرو',
    bids: 'پیشنهادهای من',
    earnings: 'درآمد و تسویه پایا',
    ratings: 'امتیازات و کارنامه',
    disputes: 'شکایت، دموراژ و سوانح',
    messages: 'پیام‌ها و دیسپچ',
    notifications: 'مرکز اعلانات',
    settings: 'تنظیمات سامانه',
    systemSettings: 'تنظیمات سامانه TLD',

    // Driver Dashboard
    hello: 'سلام',
    verifiedDriver: 'احراز هویت شده',
    diamondDriverBadge: 'پایه یک بین‌المللی • رتبه راننده الماس TLD (امتیاز ۴.۹۸★)',
    cargoMarketplace: 'تالار اعلام بار',
    activeTripBtn: 'سفر فعال',
    driverFlowHub: 'بخش‌ها و خدمات جریان راننده (Driver Flow Hub)',
    driverFlowHubSub: 'دسترسی سریع به کلیه ابزارهای هوشمند رانندگی',
    registerVehicleTitle: 'ثبت / مدیریت خودرو',
    registerVehicleSub: 'پلاک، سنسور و TLD Box',
    myBidsTitle: 'پیشنهادهای من (Bids)',
    myBidsSub: 'مذاکره کرایه و تایید بار',
    activeTripTitle: 'سفر فعال و بارگیری',
    activeTripSub: 'چک‌پوینت‌ها و تخلیه بار',
    tripHistoryTitle: 'تاریخچه سفرها',
    tripHistorySub: 'سوابق و دانلود بارنامه‌ها',
    earningsTitle: 'درآمد و تسویه',
    earningsSub: 'واریز آنی شبا و پایا',
    disputesTitle: 'شکایت و دموراژ',
    disputesSub: 'خسارت معطلی و سوانح',
    activeVoyageLive: 'سفر فعال جاری: ترانزیت دارو و زنجیره سرد',
    loadedAtOrigin: 'بارگیری شد',
    unloadWithOtp: 'تخلیه با OTP',
    distanceTraveled: 'مسافت طی شده',
    remainingToDestination: 'باقیمانده تا انبار مقصد',
    grossFreightFare: 'کرایه ناخالص سفر',
    connectedFleet: 'ناوگان متصل',
    vehicleSettings: 'تنظیمات خودرو',
    truckPlate: 'پلاک کشنده:',
    trailerType: 'نوع بارگیر:',
    iotStatus: 'وضعیت TLD Box IoT:',
    onlineConnected: 'آنلاین و متصل',
    reeferTemp: 'دمای سنسور یخچال:',
    viewScorecard: 'مشاهده کارنامه و نظرات راننده (۴.۹۸★)',

    // Shipper
    shipperPortalTitle: 'پنل جامع لجستیک سازمانی فرستنده (Shipper Portal)',
    shipperPortalSub: 'مدیریت زنجیره تامین کالا',
    shipperDashboardTitle: 'داشبورد مدیریت ترابری و باربری',
    shipperDashboardDesc: 'مدیریت هوشمند زنجیره حمل، عقد قرارداد دیجیتال، حساب امانی و رهگیری ماهواره‌ای',
    shipperDocumentsBtn: 'مدارک و پرونده ثبتی',
    legalVerified: 'احراز هویت شده (حقوقی)',
    createCargo: 'ثبت بار جدید',
    createCargoSub: 'ثبت اعلام بار جدید',
    activeCargos: 'مدیریت بارهای فعال',
    activeCargosSub: 'بارهای در حال پردازش',
    compareBids: 'پیشنهادها و مقایسه رانندگان',
    compareBidsSub: 'مقایسه کرایه و سوابق',
    contracts: 'قرارداد دیجیتال و بارنامه',
    contractsSub: 'امضای الکترونیک تمبردار',
    escrow: 'حساب امانی و تسویه مالی',
    escrowSub: 'شاپرک و آزادسازی پس از تحویل',
    tracking: 'رهگیری زنده محموله',
    trackingSub: 'نقشه ماهواره‌ای و سرعت',
    invoices: 'صورتحساب‌ها و فاکتور رسمی',
    invoicesSub: 'فاکتور الکترونیک مودیان',
    currentCargoOps: 'عملیات جاری محموله‌ها',
    viewAllActiveCargos: 'مشاهده همه بارهای فعال',
    satelliteTracking: 'رهگیری ماهواره‌ای',
    driverBidsCount: 'پیشنهاد راننده',
    documents: 'اسناد',
    escrowAndDocs: 'حساب امانی و اسناد',
    manage: 'مدیریت',
    escrowBlockedAmount: 'مبلغ امانت بلوکه‌شده شاپرک:',
    releaseAfterPod: 'آزادسازی پس از تایید تحویل POD',
    digitalContractStamped: 'قرارداد دیجیتال و بارنامه تمبردار',
    officialTaxInvoice: 'فاکتور رسمی مودیان مالیاتی',
    fileDisputeArbitration: 'ثبت شکایت و ادعای خسارت داوری',
    activeDriverProposals: 'پیشنهادهای فعال رانندگان (مناقصه و مقایسه هوشمند)',
    enterBiddingTable: 'ورود به میز مناقصه و مقایسه',
    tripsCount: 'سفر',
    distanceToOrigin: 'فاصله تا مبدأ:',
    proposedFare: 'کرایه پیشنهادی:',
    selectDriver: 'انتخاب راننده',
    chat: 'گفتگو',

    // Cargo Hall
    cargoHallTitle: 'تالار اعلام بار و بارهای پیشنهادی',
    cargoHallSubtitle: 'بورس اعلام بار و پیشنهاد قیمت فوری',
    cargoHallDesc: 'جستجو در میان صدها اعلام بار روزانه، بررسی شرایط و ثبت مستقیم پیشنهاد قیمت (Bid)',
    postCargoBtn: 'ثبت اعلام بار جدید',
    myActiveBidsBtn: 'پیشنهادهای فعال من',
    searchPlaceholder: 'جستجو در شهر مبدأ، مقصد یا عنوان بار...',
    allFleetTypes: 'همه انواع ناوگان',
    reeferTrailer: 'تریلی یخچالی',
    curtainsiderTrailer: 'تریلی چادری',
    flatbedTrailer: 'تریلی کفی',
    tipperTrailer: 'تریلی کمپرسی',
    recommendedCargos: 'بارهای پیشنهادی هوشمند TLD',
    allCargos: 'همه بارها',
    readyForBids: 'بارهای آماده استعلام و پیشنهاد',
    inTransit: 'در حال حمل جاده‌ای',
    originLoading: 'مبدأ بارگیری',
    destinationUnloading: 'مقصد تخلیه',
    weight: 'وزن',
    sendFareBid: 'ارسال پیشنهاد نرخ',
    cargoSpecifications: 'مشخصات و الزامات حمل',
    insuranceCoverage: 'پوشش بیمه بارنامه:',
    downloadPdf: 'دریافت PDF بار',
    routeMap: 'نقشه مسیر',
    bidModalTitle: 'ارسال پیشنهاد کرایه (Bid)',
    fareAmountTomans: 'مبلغ کرایه پیشنهادی شما (تومان)',
    loadingReadyTime: 'زمان اعلام آمادگی جهت بارگیری',
    driverNote: 'توضیحات و شرایط تکمیلی راننده',
    cancelBtn: 'انصراف',
    submitOfficialBid: 'ارسال پیشنهاد رسمی',

    // Trips & Telemetry
    tripsPageTitle: 'مدیریت و پایش سفرهای جاده‌ای',
    tripsPageSubtitle: 'رهگیری زنده ناوگان و تله‌متری',
    activeTripsTab: 'سفرهای فعال',
    completedTripsTab: 'سفرهای پایان‌یافته',
    allTripsTab: 'تمام سفرها',
    speed: 'سرعت',
    fuel: 'سوخت',
    temp: 'دما',
    checkpoints: 'چک‌پوینت‌ها',
    origin: 'مبدأ',
    destination: 'مقصد',
    currentSpeed: 'سرعت لحظه‌ای',
    fuelLevel: 'سطح باک گازوئیل',
    ambientTemp: 'دمای محیط محفظه',
    gpsCoordinates: 'مختصات جغرافیایی GPS',
    cargoWeightConfirmed: 'وزن تأییدشده باسکول',
    electronicSeal: 'پلمپ الکترونیک هوشمند',
    sealSecure: 'سالم و مسدود',

    // Settings
    quickAccess: 'صفحات دسترسی سریع',
    securityAndData: 'امنیت و داده‌ها',
    navigationAndNetwork: 'ناوبری و ارتباط شبکه',
    notificationsAndAlerts: 'اعلانات و هشدارهای ترافیکی',
    systemLanguage: 'زبان سامانه',
    changePassword: 'تغییر رمز عبور',
    clearCache: 'پاکسازی حافظه موقت',
    highAccuracyGps: 'موقعیت‌یابی با دقت بالا (High Precision GPS)',
    sensorAlerts: 'هشدارهای سنسور دما و قفل TLD',
    smsAlerts: 'پیامک‌های فوری (SMS)',
    pushNotifications: 'نوتیفیکیشن‌های درون‌برنامه‌ای',
    sound: 'صدای زنگ و هشدارهای صوتی',
  },

  en: {
    // Common
    appName: 'TLD Logistics',
    appTitle: 'Integrated Intelligent Heavy Transport Logistics Management',
    slogan: 'Smart Logistics Automation',
    start: 'Get Started',
    skip: 'Skip',
    next: 'Next',
    back: 'Back',
    continue: 'Continue',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    filter: 'Filter',
    search: 'Search',
    status: 'Status',
    scanQr: 'Scan QR Code',
    support: 'Support',
    faq: 'FAQ',
    about: 'About TLD',
    contact: 'Contact Us',
    transactions: 'Transactions',
    wallet: 'Wallet',
    loading: 'Loading system...',
    offlineNotice: 'No internet connection (Offline Mode)',
    completed: 'COMPLETED',
    inProgress: 'IN PROGRESS',
    pending: 'PENDING',
    active: 'ACTIVE',
    canceled: 'CANCELED',
    edit: 'Edit',
    delete: 'Delete',
    viewDetails: 'View Details',
    close: 'Close',
    refresh: 'Refresh',
    success: 'Success',
    error: 'Error',
    info: 'Information',
    warning: 'Warning',
    currencyTomans: 'Tomans',
    currencyRials: 'Rials',
    km: 'km',
    hours: 'hours',
    minutes: 'mins',
    tons: 'Tons',

    // Language
    selectLanguage: 'Select System Language',
    selectLanguageSub: 'Please select your preferred language to continue.',
    farsi: 'Farsi (Persian)',
    english: 'English',
    turkish: 'Turkish (Türkçe)',

    // Onboarding
    onboarding1Title: 'Heavy Transport, Intelligent & Integrated',
    onboarding1Desc: 'Comprehensive fleet management system for precision control, smart routing, and real-time heavy cargo oversight.',
    onboarding2Title: 'Smart Driver & Shipper Matching',
    onboarding2Desc: 'Using advanced AI algorithms, find the best loads matching your route and fleet in record time.',
    onboarding3Title: 'Complete, Secure & Unified Control',
    onboarding3Desc: 'From loading to delivery, secure escrow payments and live IoT telemetry are at your fingertips.',
    syncingTelemetry: 'SYNCING TELEMETRY',

    // Auth
    login: 'Sign In',
    loginOtp: 'Sign In with OTP',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create Account',
    mobileNumber: 'Mobile Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    emailOptional: 'Email (Optional)',
    termsAgreement: 'I accept the system terms and conditions.',
    terms: 'Terms and Conditions',
    enterMobile: 'Sign in to access the dashboard and manage fleet.',
    sendCode: 'Enter your mobile number to receive a recovery code',
    backToLogin: 'Back to Login',
    needSupport: 'Need assistance?',
    contactSupport: 'Contact Support',
    verifyMobile: 'Verify Mobile Number',
    codeSentTo: 'Verification code sent to:',
    verifyAndContinue: 'Verify and Continue',
    resendCode: 'Resend Code',
    changeNumber: 'Change Number',
    resetPasswordTitle: 'Reset Password',
    resetPasswordDesc: 'Enter your new password with at least 6 characters.',
    newPassword: 'New Password',
    passwordChangedSuccess: 'Password changed successfully.',

    // Roles & Profile
    selectRole: 'Select User Role',
    selectRoleSubtitle: 'Please select your role in the TLD Logistics system.',
    driver: 'Driver',
    driverSubtitle: 'Heavy vehicle freight & smart navigation',
    shipper: 'Shipper',
    shipperSubtitle: 'Cargo registration & shipment tracking',
    fleetAdmin: 'Fleet Manager',
    completeProfile: 'Complete Profile',
    profileProgress: 'Profile Completion Progress',
    uploadPhoto: 'Upload Profile Image',
    changePhoto: 'Change Image',
    fullName: 'Full Name',
    nationalId: 'National ID',
    dob: 'Date of Birth',
    address: 'Postal Address',
    saveAndContinue: 'Save & Continue',
    saveDraft: 'Save Draft',
    draftSaved: 'Draft Saved',
    underReview: 'Under Review',
    pendingReview: 'PENDING REVIEW',
    reviewNotice: 'Your documents have been received and are under review by our team. You will be notified within 24 hours via SMS.',
    viewDocs: 'View Documents',
    approvalStages: 'Approval Stages',
    step1: 'Initial Information Submission',
    step2: 'Identity Documents Upload',
    step3: 'Specialist Verification',
    step4: 'Final Approval & Activation',
    requestId: 'REQUEST ID',
    submittedAt: 'SUBMITTED AT',
    logOut: 'Log Out',
    profile: 'Account & Profile',
    accountSettings: 'Account Settings',

    // Nav
    home: 'Home',
    dashboard: 'Dashboard',
    cargos: 'Cargo Hall',
    trips: 'Trips',
    activeTrip: 'Active Trip & POD',
    tripHistory: 'Trip History',
    vehicle: 'Vehicle Management',
    bids: 'My Bids',
    earnings: 'Earnings & Payouts',
    ratings: 'Ratings & Scorecard',
    disputes: 'Disputes & Demurrage',
    messages: 'Messages & Dispatch',
    notifications: 'Notifications Center',
    settings: 'System Settings',
    systemSettings: 'TLD System Settings',

    // Driver Dashboard
    hello: 'Hello',
    verifiedDriver: 'Verified Driver',
    diamondDriverBadge: 'International Class 1 • TLD Diamond Driver (Score 4.98★)',
    cargoMarketplace: 'Freight Exchange',
    activeTripBtn: 'Active Trip',
    driverFlowHub: 'Driver Flow & Services Hub',
    driverFlowHubSub: 'Instant access to all smart driving tools',
    registerVehicleTitle: 'Vehicle Management',
    registerVehicleSub: 'Plate, Sensors & TLD Box',
    myBidsTitle: 'My Bids & Quotes',
    myBidsSub: 'Fare negotiation & confirmation',
    activeTripTitle: 'Active Trip & Loading',
    activeTripSub: 'Checkpoints & POD delivery',
    tripHistoryTitle: 'Trip History',
    tripHistorySub: 'Past voyages & waybills',
    earningsTitle: 'Earnings & Payouts',
    earningsSub: 'Instant bank settlements',
    disputesTitle: 'Disputes & Demurrage',
    disputesSub: 'Delay compensation & incidents',
    activeVoyageLive: 'Active Live Voyage: Cold Chain Pharma Transit',
    loadedAtOrigin: 'Loaded at Origin',
    unloadWithOtp: 'Delivery with OTP',
    distanceTraveled: 'Distance Traveled',
    remainingToDestination: 'Remaining to Destination',
    grossFreightFare: 'Gross Freight Fare',
    connectedFleet: 'Connected Fleet',
    vehicleSettings: 'Vehicle Settings',
    truckPlate: 'Tractor Plate:',
    trailerType: 'Trailer Type:',
    iotStatus: 'TLD Box IoT Status:',
    onlineConnected: 'Online & Streaming',
    reeferTemp: 'Reefer Sensor Temp:',
    viewScorecard: 'View Driver Scorecard & Reviews (4.98★)',

    // Shipper
    shipperPortalTitle: 'Enterprise Shipper Logistics Portal',
    shipperPortalSub: 'Supply Chain Management',
    shipperDashboardTitle: 'Freight & Transportation Dashboard',
    shipperDashboardDesc: 'Intelligent transport management, digital smart contracts, escrow vault, and live GPS tracking.',
    shipperDocumentsBtn: 'Company Files & Registry',
    legalVerified: 'Verified Legal Entity',
    createCargo: 'Post New Cargo',
    createCargoSub: 'Publish load in 6 steps',
    activeCargos: 'Active Shipments',
    activeCargosSub: 'Loads currently in transit',
    compareBids: 'Driver Bids Comparison',
    compareBidsSub: 'Compare driver rates and ETA',
    contracts: 'Digital Contracts & Waybill',
    contractsSub: 'Official stamped e-contracts',
    escrow: 'Escrow Vault & Payouts',
    escrowSub: 'Guaranteed payment on delivery',
    tracking: 'Live Cargo Tracking',
    trackingSub: 'Satellite map & telemetry',
    invoices: 'Official Invoices',
    invoicesSub: 'Electronic tax invoices',
    currentCargoOps: 'Active Cargo Operations',
    viewAllActiveCargos: 'View All Active Cargos',
    satelliteTracking: 'Satellite Tracking',
    driverBidsCount: 'Driver Bids',
    documents: 'Documents',
    escrowAndDocs: 'Escrow Vault & Legal',
    manage: 'Manage',
    escrowBlockedAmount: 'Blocked Escrow Amount:',
    releaseAfterPod: 'Released automatically upon POD delivery',
    digitalContractStamped: 'Digital Contract & Stamped Waybill',
    officialTaxInvoice: 'Official Tax System Invoice',
    fileDisputeArbitration: 'File Dispute & Demurrage Claim',
    activeDriverProposals: 'Active Driver Proposals (Smart Tender & Comparison)',
    enterBiddingTable: 'Enter Comparison & Bidding Table',
    tripsCount: 'Trips',
    distanceToOrigin: 'Distance to Origin:',
    proposedFare: 'Proposed Fare:',
    selectDriver: 'Select Driver',
    chat: 'Chat',

    // Cargo Hall
    cargoHallTitle: 'Freight Exchange & Cargo Marketplace',
    cargoHallSubtitle: 'Freight Exchange & Instant Bidding',
    cargoHallDesc: 'Search hundreds of daily freight postings, review requirements, and submit direct fare bids.',
    postCargoBtn: 'Post New Cargo',
    myActiveBidsBtn: 'My Active Bids',
    searchPlaceholder: 'Search by origin, destination or cargo title...',
    allFleetTypes: 'All Fleet Types',
    reeferTrailer: 'Refrigerated Trailer',
    curtainsiderTrailer: 'Curtainsider Trailer',
    flatbedTrailer: 'Flatbed Trailer',
    tipperTrailer: 'Tipper Trailer',
    recommendedCargos: 'AI Recommended Cargos',
    allCargos: 'All Cargos',
    readyForBids: 'Ready for Bids',
    inTransit: 'In Transit',
    originLoading: 'Origin Loading',
    destinationUnloading: 'Destination Delivery',
    weight: 'Weight',
    sendFareBid: 'Submit Fare Bid',
    cargoSpecifications: 'Cargo Specifications',
    insuranceCoverage: 'Insurance Coverage:',
    downloadPdf: 'Export PDF Waybill',
    routeMap: 'Route Map',
    bidModalTitle: 'Submit Fare Bid (Quote)',
    fareAmountTomans: 'Your Proposed Fare (Tomans)',
    loadingReadyTime: 'Ready to Load Date/Time',
    driverNote: 'Driver Additional Notes & Conditions',
    cancelBtn: 'Cancel',
    submitOfficialBid: 'Submit Official Quote',

    // Trips & Telemetry
    tripsPageTitle: 'Fleet Trips & Transit Tracking',
    tripsPageSubtitle: 'Live Fleet Tracking & Telemetry',
    activeTripsTab: 'Active Trips',
    completedTripsTab: 'Completed Trips',
    allTripsTab: 'All Trips',
    speed: 'Speed',
    fuel: 'Fuel',
    temp: 'Temp',
    checkpoints: 'Checkpoints',
    origin: 'Origin',
    destination: 'Destination',
    currentSpeed: 'Current Speed',
    fuelLevel: 'Diesel Fuel Level',
    ambientTemp: 'Chamber Temperature',
    gpsCoordinates: 'GPS Coordinates',
    cargoWeightConfirmed: 'Weighbridge Verified Weight',
    electronicSeal: 'Smart Electronic Seal',
    sealSecure: 'Intact & Sealed',

    // Settings
    quickAccess: 'Quick Access Pages',
    securityAndData: 'Security & Data',
    navigationAndNetwork: 'Navigation & Network',
    notificationsAndAlerts: 'Notifications & Traffic Alerts',
    systemLanguage: 'System Language',
    changePassword: 'Change Password',
    clearCache: 'Clear App Cache',
    highAccuracyGps: 'High Precision GPS Tracking',
    sensorAlerts: 'TLD Smart Sensor & Seal Alerts',
    smsAlerts: 'Urgent SMS Notifications',
    pushNotifications: 'In-App Push Notifications',
    sound: 'Notification Sound & Audio Chimes',
  },

  tr: {
    // Common
    appName: 'TLD Lojistik',
    appTitle: 'Entegre Akıllı Ağır Yük Lojistik Yönetimi',
    slogan: 'Lojistikte Akıllı Otomasyon',
    start: 'Başlayın',
    skip: 'Atla',
    next: 'İleri',
    back: 'Geri',
    continue: 'Devam Et',
    save: 'Kaydet',
    cancel: 'İptal',
    confirm: 'Onayla',
    filter: 'Filtrele',
    search: 'Ara',
    status: 'Durum',
    scanQr: 'QR Kod Tara',
    support: 'Destek',
    faq: 'SSS',
    about: 'TLD Hakkında',
    contact: 'İletişim',
    transactions: 'İşlemler',
    wallet: 'Cüzdan',
    loading: 'Sistem yükleniyor...',
    offlineNotice: 'İnternet bağlantısı yok (Çevrimdışı Mod)',
    completed: 'TAMAMLANDI',
    inProgress: 'DEVAM EDİYOR',
    pending: 'BEKLEMEDE',
    active: 'AKTİF',
    canceled: 'İPTAL EDİLDİ',
    edit: 'Düzenle',
    delete: 'Sil',
    viewDetails: 'Detayları Gör',
    close: 'Kapat',
    refresh: 'Yenile',
    success: 'Başarılı',
    error: 'Hata',
    info: 'Bilgi',
    warning: 'Uyarı',
    currencyTomans: 'Toman',
    currencyRials: 'Riyal',
    km: 'km',
    hours: 'saat',
    minutes: 'dk',
    tons: 'Ton',

    // Language
    selectLanguage: 'Sistem Dilini Seçin',
    selectLanguageSub: 'Devam etmek için lütfen tercih ettiğiniz dili seçin.',
    farsi: 'Farsça (فارسی)',
    english: 'İngilizce (English)',
    turkish: 'Türkçe',

    // Onboarding
    onboarding1Title: 'Ağır Taşımacılık, Akıllı ve Entegre',
    onboarding1Desc: 'Hassas kontrol, akıllı rota ve gerçek zamanlı kargo takibi için kapsamlı filo yönetim sistemi.',
    onboarding2Title: 'Akıllı Sürücü ve Yük Sahibi Eşleşmesi',
    onboarding2Desc: 'Gelişmiş algoritmalarla rotanıza ve filonuza en uygun yükleri anında bulun.',
    onboarding3Title: 'Eksiksiz, Güvenli ve Birleşik Kontrol',
    onboarding3Desc: 'Yüklemeden teslimata, emanet hesap güvencesi ve canlı IoT telemetrisi parmaklarınızın ucunda.',
    syncingTelemetry: 'TELEMETRİ EŞİTLENİYOR',

    // Auth
    login: 'Giriş Yap',
    loginOtp: 'OTP ile Giriş Yap',
    forgotPassword: 'Şifremi unuttum?',
    noAccount: 'Hesabınız yok mu?',
    createAccount: 'Hesap Oluştur',
    mobileNumber: 'Cep Telefonu',
    password: 'Şifre',
    confirmPassword: 'Şifreyi Onayla',
    firstName: 'Ad',
    lastName: 'Soyad',
    email: 'E-posta',
    emailOptional: 'E-posta (İsteğe Bağlı)',
    termsAgreement: 'Sistem kural ve koşullarını kabul ediyorum.',
    terms: 'Kullanım Koşulları',
    enterMobile: 'Filoyu yönetmek ve panele erişmek için giriş yapın.',
    sendCode: 'Kurtarma kodunu almak için cep telefonu numaranızı girin',
    backToLogin: 'Girişe Dön',
    needSupport: 'Desteğe mi ihtiyacınız var?',
    contactSupport: 'Destekle İletişime Geçin',
    verifyMobile: 'Telefon Numarasını Doğrula',
    codeSentTo: 'Doğrulama kodu gönderildi:',
    verifyAndContinue: 'Doğrula ve Devam Et',
    resendCode: 'Kodu Tekrar Gönder',
    changeNumber: 'Numarayı Değiştir',
    resetPasswordTitle: 'Şifre Yenileme',
    resetPasswordDesc: 'En az 6 karakterden oluşan yeni şifrenizi girin.',
    newPassword: 'Yeni Şifre',
    passwordChangedSuccess: 'Şifreniz başarıyla değiştirildi.',

    // Roles & Profile
    selectRole: 'Kullanıcı Rolü Seçin',
    selectRoleSubtitle: 'Lütfen TLD Logistics sistemindeki rolünüzü seçin.',
    driver: 'Sürücü (Driver)',
    driverSubtitle: 'Ağır nakliye ve akıllı filo taşımacılığı',
    shipper: 'Yük Sahibi (Shipper)',
    shipperSubtitle: 'Kargo kaydı ve yük yönetimi',
    fleetAdmin: 'Filo Yöneticisi',
    completeProfile: 'Profili Tamamla',
    profileProgress: 'Profil Tamamlama İlerlemesi',
    uploadPhoto: 'Profil Fotoğrafı Yükle',
    changePhoto: 'Fotoğrafı Değiştir',
    fullName: 'Ad Soyad',
    nationalId: 'Kimlik Numarası',
    dob: 'Doğum Tarihi',
    address: 'Adres',
    saveAndContinue: 'Kaydet ve Devam Et',
    saveDraft: 'Taslak Olarak Kaydet',
    draftSaved: 'Taslak Kaydedildi',
    underReview: 'İnceleme Altında',
    pendingReview: 'ONAY BEKLİYOR',
    reviewNotice: 'Belgeleriniz alındı ve ekibimiz tarafından 24 saat içinde incelenecektir. Gelişmeler SMS ile bildirilecektir.',
    viewDocs: 'Belgeleri Görüntüle',
    approvalStages: 'Onay Aşamaları',
    step1: 'Temel Bilgi Kaydı',
    step2: 'Kimlik Belgeleri Yükleme',
    step3: 'Uzman İncelemesi',
    step4: 'Nihai Onay ve Hesap Aktivasyonu',
    requestId: 'TALEP NO',
    submittedAt: 'GÖNDERİM TARİHİ',
    logOut: 'Çıkış Yap',
    profile: 'Hesap & Profil',
    accountSettings: 'Hesap Ayarları',

    // Nav
    home: 'Ana Sayfa',
    dashboard: 'Panel',
    cargos: 'Yük Pazarı',
    trips: 'Seferler',
    activeTrip: 'Aktif Sefer & POD',
    tripHistory: 'Sefer Geçmişi',
    vehicle: 'Araç Yönetimi',
    bids: 'Tekliflerim',
    earnings: 'Kazanç ve Ödemeler',
    ratings: 'Puanlama & Karne',
    disputes: 'İtirazlar ve Demoraj',
    messages: 'Mesajlar & Dispeç',
    notifications: 'Bildirim Merkezi',
    settings: 'Sistem Ayarları',
    systemSettings: 'TLD Sistem Ayarları',

    // Driver Dashboard
    hello: 'Merhaba',
    verifiedDriver: 'Doğrulanmış Sürücü',
    diamondDriverBadge: 'Uluslararası Sınıf 1 • TLD Elmas Sürücü (Puan 4.98★)',
    cargoMarketplace: 'Yük Pazarı',
    activeTripBtn: 'Aktif Sefer',
    driverFlowHub: 'Sürücü İşlemleri ve Hizmet Merkezi',
    driverFlowHubSub: 'Tüm akıllı sürüş araçlarına hızlı erişim',
    registerVehicleTitle: 'Araç Yönetimi',
    registerVehicleSub: 'Plaka, Sensörler ve TLD Box',
    myBidsTitle: 'Tekliflerim',
    myBidsSub: 'Navlun pazarlığı ve onay',
    activeTripTitle: 'Aktif Sefer ve Yükleme',
    activeTripSub: 'Kontrol noktaları ve teslimat',
    tripHistoryTitle: 'Sefer Geçmişi',
    tripHistorySub: 'Geçmiş seferler ve irsaliyeler',
    earningsTitle: 'Kazanç ve Ödemeler',
    earningsSub: 'Anında banka transferleri',
    disputesTitle: 'Şikayet ve Demoraj',
    disputesSub: 'Gecikme tazminatı ve olaylar',
    activeVoyageLive: 'Canlı Aktif Sefer: Soğuk Zincir İlaç Taşımacılığı',
    loadedAtOrigin: 'Yüklendi',
    unloadWithOtp: 'OTP ile Teslimat',
    distanceTraveled: 'Kat Edilen Mesafe',
    remainingToDestination: 'Kalan Mesafe',
    grossFreightFare: 'Brüt Navlun Ücreti',
    connectedFleet: 'Bağlı Filo',
    vehicleSettings: 'Araç Ayarları',
    truckPlate: 'Çekici Plakası:',
    trailerType: 'Dorse Tipi:',
    iotStatus: 'TLD Box IoT Durumu:',
    onlineConnected: 'Çevrimiçi ve Bağlı',
    reeferTemp: 'Termokin Sensör Sıcaklığı:',
    viewScorecard: 'Sürücü Karnesini ve Yorumları Görüntüle (4.98★)',

    // Shipper
    shipperPortalTitle: 'Kurumsal Gönderici Portalı',
    shipperPortalSub: 'Tedarik Zinciri Yönetimi',
    shipperDashboardTitle: 'Nakliye Yönetim Paneli',
    shipperDashboardDesc: 'Akıllı taşıma yönetimi, dijital sözleşmeler, emanet hesap ve canlı GPS takibi.',
    shipperDocumentsBtn: 'Şirket Belgeleri',
    legalVerified: 'Doğrulanmış Tüzel Kişilik',
    createCargo: 'Yeni Yük Ekle',
    createCargoSub: '6 adımda yük ilanı',
    activeCargos: 'Aktif Yükler',
    activeCargosSub: 'Taşınmakta olan yükler',
    compareBids: 'Sürücü Teklifleri Karşılaştırma',
    compareBidsSub: 'Fiyat ve varış süresini karşılaştır',
    contracts: 'Dijital Sözleşme & İrsaliye',
    contractsSub: 'Resmi mühürlü e-sözleşmeler',
    escrow: 'Emanet Hesap & Ödemeler',
    escrowSub: 'Teslimatta garantili ödeme',
    tracking: 'Canlı Yük Takibi',
    trackingSub: 'Uydu haritası ve hız',
    invoices: 'Resmi Faturalar',
    invoicesSub: 'Elektronik vergi faturaları',
    currentCargoOps: 'Mevcut Yük Operasyonları',
    viewAllActiveCargos: 'Tüm Aktif Yükleri Gör',
    satelliteTracking: 'Uydu Takibi',
    driverBidsCount: 'Sürücü Teklifi',
    documents: 'Belgeler',
    escrowAndDocs: 'Emanet Hesap ve Hukuki İşlemler',
    manage: 'Yönet',
    escrowBlockedAmount: 'Bloke Edilen Tutar:',
    releaseAfterPod: 'Teslimat onayından sonra aktarılır',
    digitalContractStamped: 'Dijital Sözleşme ve Mühürlü İrsaliye',
    officialTaxInvoice: 'Resmi E-Fatura',
    fileDisputeArbitration: 'İtiraz ve Tazminat Talebi Aç',
    activeDriverProposals: 'Aktif Sürücü Teklifleri (Akıllı İhale)',
    enterBiddingTable: 'Karşılaştırma Masasına Gir',
    tripsCount: 'Sefer',
    distanceToOrigin: 'Yükleme Noktasına Mesafe:',
    proposedFare: 'Teklif Edilen Ücret:',
    selectDriver: 'Sürücüyü Seç',
    chat: 'Sohbet',

    // Cargo Hall
    cargoHallTitle: 'Yük Borsası & İlanlar',
    cargoHallSubtitle: 'Yük Borsası ve Anlık Teklifler',
    cargoHallDesc: 'Günlük yüzlerce yük ilanını inceleyin, şartları kontrol edin ve doğrudan navlun teklifi verin.',
    postCargoBtn: 'Yeni Yük İlanı Ver',
    myActiveBidsBtn: 'Aktif Tekliflerim',
    searchPlaceholder: 'Çıkış, varış şehri veya yük ara...',
    allFleetTypes: 'Tüm Araç Tipleri',
    reeferTrailer: 'Frigofirik Dorse',
    curtainsiderTrailer: 'Tenteli Dorse',
    flatbedTrailer: 'Açık Kasa Dorse',
    tipperTrailer: 'Damperli Dorse',
    recommendedCargos: 'Yapay Zeka Önerilen Yükler',
    allCargos: 'Tüm Yükler',
    readyForBids: 'Teklife Açık Yükler',
    inTransit: 'Yolda / Taşınıyor',
    originLoading: 'Yükleme Noktası',
    destinationUnloading: 'Teslim Noktası',
    weight: 'Ağırlık',
    sendFareBid: 'Fiyat Teklifi Ver',
    cargoSpecifications: 'Taşıma Özellikleri',
    insuranceCoverage: 'Sigorta Teminatı:',
    downloadPdf: 'İrsaliye PDF İndir',
    routeMap: 'Güzergah Haritası',
    bidModalTitle: 'Fiyat Teklifi Gönder (Bid)',
    fareAmountTomans: 'Teklif Ettiğiniz Ücret (Toman)',
    loadingReadyTime: 'Yüklemeye Hazır Olma Zamanı',
    driverNote: 'Sürücü Açıklamaları ve Şartları',
    cancelBtn: 'İptal',
    submitOfficialBid: 'Resmi Teklifi Gönder',

    // Trips & Telemetry
    tripsPageTitle: 'Filo Seferleri ve Canlı Takip',
    tripsPageSubtitle: 'Canlı Filo Takibi ve Telemetri',
    activeTripsTab: 'Aktif Seferler',
    completedTripsTab: 'Tamamlanan Seferler',
    allTripsTab: 'Tüm Seferler',
    speed: 'Hız',
    fuel: 'Yakıt',
    temp: 'Sıcaklık',
    checkpoints: 'Kontrol Noktaları',
    origin: 'Çıkış',
    destination: 'Varış',
    currentSpeed: 'Anlık Hız',
    fuelLevel: 'Dizel Yakıt Seviyesi',
    ambientTemp: 'Kabin Sıcaklığı',
    gpsCoordinates: 'GPS Konum Koordinatları',
    cargoWeightConfirmed: 'Kantar Onaylı Yük Ağırlığı',
    electronicSeal: 'Akıllı Elektronik Mühür',
    sealSecure: 'Sağlam ve Mühürlü',

    // Settings
    quickAccess: 'Hızlı Erişim Sayfaları',
    securityAndData: 'Güvenlik ve Veri',
    navigationAndNetwork: 'Navigasyon ve Ağ',
    notificationsAndAlerts: 'Bildirimler ve Uyarılar',
    systemLanguage: 'Sistem Dili',
    changePassword: 'Şifre Değiştir',
    clearCache: 'Önbelleği Temizle',
    highAccuracyGps: 'Yüksek Hassasiyetli GPS Takibi',
    sensorAlerts: 'TLD Akıllı Sensör & Mühür Uyarıları',
    smsAlerts: 'Acil SMS Bildirimleri',
    pushNotifications: 'Uygulama İçi Bildirimler',
    sound: 'Bildirim Sesleri ve Ziller',
  },
};

// Global string dictionary for automatic fallback and phrases
export const INLINE_DICTIONARY: Record<string, { en: string; tr: string }> = {
  'سلام': { en: 'Hello', tr: 'Merhaba' },
  'سلام، ': { en: 'Hello, ', tr: 'Merhaba, ' },
  'احراز هویت شده': { en: 'Verified', tr: 'Doğrulandı' },
  'احراز هویت شده (حقوقی)': { en: 'Verified Entity', tr: 'Doğrulanmış Tüzel Kişilik' },
  'تالار اعلام بار': { en: 'Cargo Hall', tr: 'Yük Pazarı' },
  'سفر فعال': { en: 'Active Trip', tr: 'Aktif Sefer' },
  'سفر فعال جاری': { en: 'Active Trip', tr: 'Aktif Sefer' },
  'سفر فعال و بارگیری': { en: 'Active Trip & Loading', tr: 'Aktif Sefer ve Yükleme' },
  'ثبت / مدیریت خودرو': { en: 'Vehicle Management', tr: 'Araç Yönetimi' },
  'پیشنهادهای من (Bids)': { en: 'My Bids', tr: 'Tekliflerim' },
  'پیشنهادهای من': { en: 'My Bids', tr: 'Tekliflerim' },
  'تاریخچه سفرها': { en: 'Trip History', tr: 'Sefer Geçmişi' },
  'درآمد و تسویه': { en: 'Earnings & Payouts', tr: 'Kazanç ve Ödemeler' },
  'شکایت و دموراژ': { en: 'Disputes & Demurrage', tr: 'Şikayet ve Demoraj' },
  'مسافت طی شده': { en: 'Distance Traveled', tr: 'Kat Edilen Mesafe' },
  'باقیمانده تا انبار مقصد': { en: 'Remaining to Destination', tr: 'Kalan Mesafe' },
  'کرایه ناخالص سفر': { en: 'Gross Freight Fare', tr: 'Brüt Navlun Ücreti' },
  'ناوگان متصل': { en: 'Connected Fleet', tr: 'Bağlı Filo' },
  'تنظیمات خودرو': { en: 'Vehicle Settings', tr: 'Araç Ayarları' },
  'پلاک کشنده:': { en: 'Tractor Plate:', tr: 'Çekici Plakası:' },
  'نوع بارگیر:': { en: 'Trailer Type:', tr: 'Dorse Tipi:' },
  'وضعیت TLD Box IoT:': { en: 'TLD Box IoT Status:', tr: 'TLD Box IoT Durumu:' },
  'آنلاین و متصل': { en: 'Online & Connected', tr: 'Çevrimiçi ve Bağlı' },
  'دمای سنسور یخچال:': { en: 'Reefer Temp:', tr: 'Termokin Sıcaklığı:' },
  'ثبت بار جدید': { en: 'Post New Cargo', tr: 'Yeni Yük Ekle' },
  'بارهای فعال': { en: 'Active Cargos', tr: 'Aktif Yükler' },
  'مقایسه رانندگان': { en: 'Compare Bids', tr: 'Sürücü Karşılaştırması' },
  'حساب امانی Escrow': { en: 'Escrow Vault', tr: 'Emanet Hesap' },
  'رهگیری زنده GPS': { en: 'Live GPS Tracking', tr: 'Canlı GPS Takibi' },
  'آرشیو و فاکتورها': { en: 'Archive & Invoices', tr: 'Arşiv ve Faturalar' },
  'ثبت اعلام بار جدید': { en: 'Post New Cargo', tr: 'Yeni Yük İlanı' },
  'پیشنهادهای فعال من': { en: 'My Active Bids', tr: 'Aktif Tekliflerim' },
  'همه بارها': { en: 'All Cargos', tr: 'Tüm Yükler' },
  'در حال حمل': { en: 'In Transit', tr: 'Yolda' },
  'آماده پیشنهاد': { en: 'Ready for Bids', tr: 'Teklife Açık' },
  'ارسال پیشنهاد نرخ': { en: 'Submit Bid', tr: 'Teklif Ver' },
  'مبدأ بارگیری': { en: 'Origin', tr: 'Yükleme Noktası' },
  'مقصد تخلیه': { en: 'Destination', tr: 'Teslim Noktası' },
  'وزن و نوع تریلر:': { en: 'Weight & Trailer:', tr: 'Ağırlık ve Dorse:' },
  'کرایه پیشنهادی فرستنده:': { en: 'Offered Price:', tr: 'Önerilen Ücret:' },
  'دمای سنسور محفظه:': { en: 'Chamber Temp:', tr: 'Bölme Sıcaklığı:' },
  'پوشش بیمه بارنامه:': { en: 'Insurance Cover:', tr: 'Sigorta Teminatı:' },
  'دریافت PDF بار': { en: 'Export Waybill PDF', tr: 'İrsaliye PDF İndir' },
  'نقشه مسیر': { en: 'Route Map', tr: 'Güzergah Haritası' },
  'چت': { en: 'Chat', tr: 'Sohbet' },
  'گفتگو': { en: 'Chat', tr: 'Sohbet' },
  'انصراف': { en: 'Cancel', tr: 'İptal' },
  'ذخیره': { en: 'Save', tr: 'Kaydet' },
  'تأیید': { en: 'Confirm', tr: 'Onayla' },
  'بازگشت': { en: 'Back', tr: 'Geri' },
  'ادامه': { en: 'Continue', tr: 'Devam Et' },
  'شروع به کار': { en: 'Get Started', tr: 'Başlayın' },
  'رد شدن': { en: 'Skip', tr: 'Atla' },
  'تهران': { en: 'Tehran', tr: 'Tahran' },
  'مشهد': { en: 'Mashhad', tr: 'Meşhed' },
  'اصفهان': { en: 'Isfahan', tr: 'İsfahan' },
  'بندرعباس': { en: 'Bandar Abbas', tr: 'Bandar Abbas' },
  'تبریز': { en: 'Tabriz', tr: 'Tebriz' },
  'شیراز': { en: 'Shiraz', tr: 'Şiraz' },
  'تایید': { en: 'Confirm', tr: 'Onayla' },
  'رد': { en: 'Reject', tr: 'Reddet' },
  'بستن': { en: 'Close', tr: 'Kapat' },
  'بعدی': { en: 'Next', tr: 'İleri' },
  'قبلی': { en: 'Previous', tr: 'Önceki' },
  'جستجو': { en: 'Search', tr: 'Ara' },
  'در حال بارگذاری…': { en: 'Loading...', tr: 'Yükleniyor…' },
  'در حال بارگذاری...': { en: 'Loading...', tr: 'Yükleniyor...' },
  'خطا': { en: 'Error', tr: 'Hata' },
  'موفق': { en: 'Successful', tr: 'Başarılı' },
  'ناموفق': { en: 'Failed', tr: 'Başarısız' },
  'در انتظار': { en: 'Pending', tr: 'Beklemede' },
  'تکمیل شده': { en: 'Completed', tr: 'Tamamlandı' },
  'لغو شده': { en: 'Canceled', tr: 'İptal Edildi' },
  'پذیرفته شده': { en: 'Accepted', tr: 'Kabul Edildi' },
  'رد شده': { en: 'Rejected', tr: 'Reddedildi' },
  'در مسیر': { en: 'In Transit', tr: 'Yolda' },
  'تحویل شده': { en: 'Delivered', tr: 'Teslim Edildi' },
  'امروز': { en: 'Today', tr: 'Bugün' },
  'دیروز': { en: 'Yesterday', tr: 'Dün' },
  'تومان': { en: 'Tomans', tr: 'Toman' },
  'کیلوگرم': { en: 'kg', tr: 'kg' },
  'تن': { en: 'Tons', tr: 'Ton' },
  'کیلومتر': { en: 'km', tr: 'km' },
  'ساعت': { en: 'Hours', tr: 'Saat' },
  'دقیقه': { en: 'Minutes', tr: 'Dakika' },
};
