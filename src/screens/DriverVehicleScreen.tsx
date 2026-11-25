import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppScreen, RegisteredVehicle } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { driverVehicleService } from '../services/driverVehicleService';

interface DriverVehicleScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const DriverVehicleScreen: React.FC<DriverVehicleScreenProps> = ({ onNavigate }) => {
  const { currentUser, showToast } = useAuth();
  const { dir, trText } = useLanguage();

  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // New vehicle form state
  const [truckType, setTruckType] = useState('تریلی چادری (Curtainsider)');
  const [brand, setBrand] = useState('ولوو (Volvo)');
  const [model, setModel] = useState('FH 500');
  const [buildYear, setBuildYear] = useState('1401');
  const [color, setColor] = useState('سفید روغنی');
  const [platePart1, setPlatePart1] = useState('12');
  const [plateLetter, setPlateLetter] = useState('ع');
  const [platePart2, setPlatePart2] = useState('345');
  const [plateIranCode, setPlateIranCode] = useState('68');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [smartCardTruck, setSmartCardTruck] = useState('');
  const [capacityTons, setCapacityTons] = useState('24');
  const [axles, setAxles] = useState('5');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoading(true);
    const data = await driverVehicleService.fetchVehicles();
    setVehicles(data);
    if (data.length > 0) {
      const primary = data.find((v) => v.isPrimary) || data[0];
      setSelectedVehicleId(primary.id);
    }
    setIsLoading(false);
  };

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleSetPrimary = async (vehicleId: string) => {
    await driverVehicleService.setPrimaryVehicle(vehicleId);
    showToast(
      'success',
      trText(
        'خودروی انتخابی به عنوان ناوگان پیش‌فرض فعال شد.',
        'The selected vehicle is now your default fleet vehicle.',
        'Seçilen araç varsayılan filo aracınız olarak etkinleştirildi.'
      )
    );
    await loadVehicles();
  };

  const handleToggleLock = async () => {
    if (!currentVehicle) return;
    setIsLocking(true);
    const newStatus = await driverVehicleService.toggleSmartLock(currentVehicle.id);
    showToast(
      'info',
      newStatus === 'LOCKED'
        ? trText(
            'قفل هوشمند TLD Q-Lock پلمب شد.',
            'TLD Q-Lock smart lock sealed.',
            'TLD Q-Lock akıllı kilit mühürlendi.'
          )
        : trText(
            'قفل هوشمند TLD Q-Lock بازگشایی شد.',
            'TLD Q-Lock smart lock unlocked.',
            'TLD Q-Lock akıllı kilidi açıldı.'
          )
    );
    await loadVehicles();
    setIsLocking(false);
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim() || !platePart1 || !platePart2) {
      showToast(
        'error',
        trText(
          'لطفاً تمامی فیلدهای الزامی خودرو را وارد نمایید.',
          'Please fill in all required vehicle fields.',
          'Lütfen aracın tüm zorunlu alanlarını doldurun.'
        )
      );
      return;
    }

    const fullPlate = `${platePart1} ${plateLetter} ${platePart2} ایران ${plateIranCode}`;
    await driverVehicleService.addVehicle({
      driverId: currentUser?.id || 'DRV-1001',
      truckType,
      brand,
      model,
      buildYear,
      color,
      plateNumber: fullPlate,
      platePart1,
      plateLetter,
      platePart2,
      plateIranCode,
      chassisNumber,
      engineNumber,
      smartCardTruck,
      capacityTons: Number(capacityTons) || 22,
      volumeM3: 88,
      axles: Number(axles) || 5,
      isPrimary: vehicles.length === 0,
      isActive: true,
      smartBoxId: `TLD-BOX-${Math.floor(1000 + Math.random() * 9000)}`,
      smartLockStatus: 'LOCKED',
      currentSpeedKmH: 0,
      cargoTemperature: 4.0,
      ambientHumidity: 35,
      batteryHealthPercent: 98,
      fuelLevelPercent: 80,
      tirePressureBar: 8.8,
    });

    showToast(
      'success',
      trText(
        'ناوگان جدید با موفقیت ثبت شد.',
        'The new fleet vehicle was registered successfully.',
        'Yeni filo aracı başarıyla kaydedildi.'
      )
    );
    setShowAddModal(false);
    await loadVehicles();
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn">
      {/* Top App Bar */}
      <AppHeader
        currentScreen="DRIVER_VEHICLE"
        title={trText('مدیریت و وضعیت خودرو', 'Vehicle Management & Status', 'Araç Yönetimi ve Durumu')}
        subtitle="Vehicle Telemetry & IoT Control"
        showBack={true}
        onBack={() => onNavigate('DRIVER_DASHBOARD')}
        onNavigate={onNavigate}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="DRIVER_VEHICLE" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-28px">local_shipping</span>
              <h1 className="font-vazirmatn text-xl md:text-2xl font-black text-[#1a1b23]">
                {trText(
                  'مدیریت و وضعیت هوشمند خودرو',
                  'Smart Vehicle Management & Status',
                  'Akıllı Araç Yönetimi ve Durumu'
                )}
              </h1>
            </div>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText(
                'مشاهده اطلاعات فنی، استانداردهای بارگیری، تله‌متری CAN-Bus و کنترل قفل هوشمند TLD',
                'View technical specifications, loading standards, CAN-Bus telemetry and TLD smart lock control',
                'Teknik özellikleri, yükleme standartlarını, CAN-Bus telemetrisini ve TLD akıllı kilit kontrolünü görüntüleyin'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-initial bg-[#00258e] hover:bg-[#0036c5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-18px">add_circle</span>
              <span>{trText('ثبت خودروی جدید', 'Register New Vehicle', 'Yeni Araç Kaydet')}</span>
            </button>
            <button
              onClick={() => onNavigate('TRIPS')}
              className="flex-1 sm:flex-initial bg-[#eeedf9] hover:bg-[#dde1ff] text-[#00258e] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-[#c4c5da] cursor-pointer"
            >
              <span className="material-symbols-outlined text-18px">route</span>
              <span>{trText('مشاهده در سفر', 'View in Trip', 'Yolculukta Görüntüle')}</span>
            </button>
          </div>
        </div>

        {/* Vehicle Selector Tabs */}
        {vehicles.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {vehicles.map((veh) => (
              <button
                key={veh.id}
                onClick={() => setSelectedVehicleId(veh.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  veh.id === currentVehicle?.id
                    ? 'bg-[#00258e] text-white border-[#00258e] shadow-sm'
                    : 'bg-white text-[#444655] border-[#c4c5da] hover:bg-[#eeedf9]'
                }`}
              >
                <span className="material-symbols-outlined text-16px">
                  {veh.isPrimary ? 'stars' : 'directions_car'}
                </span>
                <span>{veh.brand} {veh.model}</span>
                <span className="text-[10px] opacity-80" dir="ltr">({veh.plateNumber})</span>
                {veh.isPrimary && (
                  <span className="bg-[#00a368] text-white text-[9px] px-1.5 py-0.5 rounded">{trText('اصلی', 'Primary', 'Birincil')}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {currentVehicle ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Vehicle Plate & Specs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Truck Profile Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e2e1ed] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#eeedf9] border border-[#c4c5da] flex items-center justify-center text-[#00258e]">
                      <span className="material-symbols-outlined text-32px">front_loader</span>
                    </div>
                    <div>
                      <h2 className="font-vazirmatn text-lg font-bold text-[#1a1b23]">
                        {currentVehicle.brand} {currentVehicle.model}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-[#545f72] mt-0.5">
                        <span>{trText('نوع کاربری:', 'Usage type:', 'Kullanım tipi:')} <strong>{currentVehicle.truckType}</strong></span>
                        <span>•</span>
                        <span>{trText('مدل:', 'Model:', 'Model:')} {currentVehicle.buildYear}</span>
                      </div>
                    </div>
                  </div>

                  {!currentVehicle.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(currentVehicle.id)}
                      className="text-xs bg-[#e8e7f3] hover:bg-[#dde1ff] text-[#00258e] px-3 py-1.5 rounded-lg font-bold border border-[#c4c5da] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-16px">check_circle</span>
                      <span>{trText('انتخاب به عنوان ناوگان اصلی', 'Set as Primary Fleet', 'Birincil Filo Olarak Ayarla')}</span>
                    </button>
                  )}
                </div>

                {/* Iranian Standard Plate Display */}
                <div className="flex flex-col items-center justify-center p-4 bg-[#f8f9fe] rounded-xl border border-[#c4c5da]/60">
                  <span className="text-[11px] font-bold text-[#747686] mb-1.5">{trText('پلاک ملی ناوگان عمومی سنگین', 'National Heavy Commercial Fleet Plate', 'Ağır Ticari Filo Ulusal Plakası')}</span>
                  <div
                    className="flex items-center bg-[#ffcc00] text-black border-2 border-black rounded-lg px-4 py-2 font-bold shadow-md select-none"
                    dir="ltr"
                  >
                    <div className="bg-[#003399] text-white px-2 py-2 rounded-l text-[10px] flex flex-col items-center justify-center border-r border-black mr-2">
                      <span className="text-[8px]">I.R.</span>
                      <span className="text-[7px]">IRAN</span>
                    </div>
                    <span className="text-xl font-jetbrains tracking-wider font-extrabold mx-1">
                      {currentVehicle.platePart1}
                    </span>
                    <span className="text-xl font-vazirmatn font-black text-[#ba1a1a] mx-1">
                      {currentVehicle.plateLetter}
                    </span>
                    <span className="text-xl font-jetbrains tracking-wider font-extrabold mx-1">
                      {currentVehicle.platePart2}
                    </span>
                    <div className="border-l-2 border-black pl-2 ml-2 flex flex-col items-center">
                      <span className="text-[9px] font-vazirmatn">{trText('ایران', 'IRAN', 'İRAN')}</span>
                      <span className="text-sm font-jetbrains font-bold">{currentVehicle.plateIranCode}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[#747686]">{trText('ظرفیت ناخالص مجاز', 'Permissible Gross Capacity', 'İzin Verilen Brüt Kapasite')}</div>
                    <div className="text-sm font-bold text-[#1a1b23] mt-1">
                      {trText(`${currentVehicle.capacityTons} تن`, `${currentVehicle.capacityTons} tons`, `${currentVehicle.capacityTons} ton`)}
                    </div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[#747686]">{trText('حجم بارگیر', 'Cargo Volume', 'Kargo Hacmi')}</div>
                    <div className="text-sm font-bold text-[#1a1b23] mt-1">
                      {trText(`${currentVehicle.volumeM3 || 88} متر مکعب`, `${currentVehicle.volumeM3 || 88} m³`, `${currentVehicle.volumeM3 || 88} m³`)}
                    </div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[#747686]">{trText('تعداد محورها', 'Number of Axles', 'Aks Sayısı')}</div>
                    <div className="text-sm font-bold text-[#1a1b23] mt-1">
                      {trText(`${currentVehicle.axles} محور (تریلی)`, `${currentVehicle.axles} axles (trailer)`, `${currentVehicle.axles} aks (dorse)`)}
                    </div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[#747686]">{trText('کارت هوشمند ناوگان', 'Fleet Smart Card', 'Filo Akıllı Kartı')}</div>
                    <div className="text-sm font-bold font-jetbrains text-[#00258e] mt-1" dir="ltr">
                      {trText(currentVehicle.smartCardTruck || '۹۹۲۱۴۸۵', currentVehicle.smartCardTruck || '9921485', currentVehicle.smartCardTruck || '9921485')}
                    </div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[#747686]">{trText('رنگ بدنه', 'Body Color', 'Kaporta Rengi')}</div>
                    <div className="text-sm font-bold text-[#1a1b23] mt-1">{currentVehicle.color}</div>
                  </div>
                  <div className="p-3 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="text-[#747686]">{trText('وضعیت معاینه فنی', 'Technical Inspection Status', 'Teknik Muayene Durumu')}</div>
                    <div className="text-sm font-bold text-[#00a368] mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-14px">verified</span>
                      <span>{trText('معتبر تا ۱۴۰۳/۱۱', 'Valid until 1403/11', '1403/11 tarihine kadar geçerli')}</span>
                    </div>
                  </div>
                </div>

                {/* VIN & Engine Numbers */}
                <div className="p-3.5 bg-[#f0f4ff] rounded-xl border border-[#c4c5da]/70 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#444655]">{trText('شماره شاسی (VIN):', 'Chassis Number (VIN):', 'Şasi Numarası (VIN):')}</span>
                    <span className="font-jetbrains font-bold text-[#1a1b23]" dir="ltr">
                      {currentVehicle.chassisNumber || 'YV2AZ02C8NB719241'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#444655]">{trText('شماره موتور:', 'Engine Number:', 'Motor Numarası:')}</span>
                    <span className="font-jetbrains font-bold text-[#1a1b23]" dir="ltr">
                      {currentVehicle.engineNumber || 'D13K500-EU6-4921'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Telemetry & Smart Box (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Smart Box IoT & Sensors Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#c4c5da] shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#00a368] animate-pulse"></span>
                    <h3 className="font-vazirmatn text-base font-bold text-[#1a1b23]">
                      {trText('وضعیت سنسورها و باکس هوشمند', 'Sensor & Smart Box Status', 'Sensör ve Akıllı Kutu Durumu')}
                    </h3>
                  </div>
                  <span className="font-jetbrains text-[10px] text-[#00258e] bg-[#eeedf9] px-2 py-0.5 rounded-full font-bold">
                    {currentVehicle.smartBoxId}
                  </span>
                </div>

                {/* Smart Lock Control */}
                <div className="p-4 bg-[#f8f9fe] rounded-xl border border-[#c4c5da] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        currentVehicle.smartLockStatus === 'LOCKED'
                          ? 'bg-[#00258e] text-white'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-24px">
                        {currentVehicle.smartLockStatus === 'LOCKED' ? 'lock' : 'lock_open'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-[#747686]">{trText('قفل دیجیتال پلمب بار (TLD Q-Lock)', 'Digital Cargo Seal Lock (TLD Q-Lock)', 'Dijital Kargo Mühür Kilidi (TLD Q-Lock)')}</div>
                      <div className="text-sm font-bold text-[#1a1b23] mt-0.5">
                        {currentVehicle.smartLockStatus === 'LOCKED'
                          ? trText('پلمب و قفل ایمن (LOCKED)', 'Sealed & Securely Locked (LOCKED)', 'Mühürlü ve Güvenli Kilitli (LOCKED)')
                          : trText('بازگشایی شده (UNLOCKED)', 'Unlocked (UNLOCKED)', 'Kilidi Açıldı (UNLOCKED)')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleLock}
                    disabled={isLocking}
                    className="text-xs bg-[#00258e] hover:bg-[#0036c5] text-white font-bold px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLocking
                      ? trText('در حال ارسال...', 'Sending...', 'Gönderiliyor...')
                      : currentVehicle.smartLockStatus === 'LOCKED'
                        ? trText('باز کردن', 'Unlock', 'Kilidi Aç')
                        : trText('قفل کردن', 'Lock', 'Kilitle')}
                  </button>
                </div>

                {/* Live Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Cargo Temp */}
                  <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="flex items-center justify-between text-[#747686] text-xs">
                      <span>{trText('دمای کانتینر', 'Container Temperature', 'Konteyner Sıcaklığı')}</span>
                      <span className="material-symbols-outlined text-18px text-[#00258e]">thermostat</span>
                    </div>
                    <div className="text-xl font-bold font-jetbrains text-[#1a1b23] mt-1" dir="ltr">
                      {currentVehicle.cargoTemperature} °C
                    </div>
                    <span className="text-[10px] text-[#00a368] font-bold">{trText('زنجیره استاندارد', 'Standard Cold Chain', 'Standart Soğuk Zincir')}</span>
                  </div>

                  {/* Battery */}
                  <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="flex items-center justify-between text-[#747686] text-xs">
                      <span>{trText('باتری باکس', 'Box Battery', 'Kutu Bataryası')}</span>
                      <span className="material-symbols-outlined text-18px text-[#00a368]">battery_charging_full</span>
                    </div>
                    <div className="text-xl font-bold font-jetbrains text-[#1a1b23] mt-1" dir="ltr">
                      {currentVehicle.batteryHealthPercent}%
                    </div>
                    <span className="text-[10px] text-[#747686]">{trText('ولتاژ ۲۴.۴ ولت', 'Voltage 24.4 V', 'Voltaj 24,4 V')}</span>
                  </div>


                  {/* Tire Pressure */}
                  <div className="p-3.5 bg-[#fbf8ff] rounded-xl border border-[#e2e1ed]">
                    <div className="flex items-center justify-between text-[#747686] text-xs">
                      <span>{trText('فشار باد TPMS', 'TPMS Tire Pressure', 'TPMS Lastik Basıncı')}</span>
                      <span className="material-symbols-outlined text-18px text-[#747686]">tire_repair</span>
                    </div>
                    <div className="text-xl font-bold font-jetbrains text-[#1a1b23] mt-1" dir="ltr">
                      {currentVehicle.tirePressureBar} Bar
                    </div>
                    <span className="text-[10px] text-[#00a368] font-bold">{trText('تمام محورها نرمال', 'All axles normal', 'Tüm akslar normal')}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#e8e7f3] rounded-xl text-center text-xs text-[#545f72] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-16px text-[#00258e]">sync</span>
                  <span>{trText('آخرین همگام‌سازی تله‌متری:', 'Last telemetry sync:', 'Son telemetri eşitlemesi:')} <strong>{currentVehicle.lastSyncTime}</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-[#c4c5da] text-center space-y-3">
            <span className="material-symbols-outlined text-48px text-[#747686]">no_crash</span>
            <h3 className="font-bold text-base text-[#1a1b23]">{trText('هیچ خودرویی برای این حساب ثبت نشده است', 'No vehicle is registered for this account', 'Bu hesaba kayıtlı araç bulunmuyor')}</h3>
            <p className="text-xs text-[#545f72]">{trText('لطفاً با کلیک بر روی دکمه زیر، مشخصات کامیون خود را ثبت فرمایید.', 'Please click the button below to register your truck details.', 'Lütfen kamyonunuzun bilgilerini kaydetmek için aşağıdaki düğmeye tıklayın.')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#00258e] text-white px-5 py-2 rounded-xl text-xs font-bold"
            >
              {trText('افزودن اولین خودرو', 'Add First Vehicle', 'İlk Aracı Ekle')}
            </button>
          </div>
        )}
      </main>

      {/* Modal: Add New Vehicle */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-[#c4c5da] p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00258e]">add_circle</span>
                <h3 className="font-bold text-base text-[#1a1b23]">{trText('ثبت خودرو و ناوگان جدید', 'Register New Vehicle & Fleet', 'Yeni Araç ve Filo Kaydet')}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#444655]">{trText('نوع بارگیر', 'Body Type', 'Kasa Tipi')}</label>
                  <select
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs"
                  >
                    <option value="تریلی چادری (Curtainsider)">{trText('تریلی چادری (Curtainsider)', 'Curtainsider Trailer', 'Perdeli Dorse')}</option>
                    <option value="تریلی یخچالی (Refrigerated)">{trText('تریلی یخچالی (Refrigerated)', 'Refrigerated Trailer', 'Soğutmalı Dorse')}</option>
                    <option value="تریلی کفی (Flatbed)">{trText('تریلی کفی (Flatbed)', 'Flatbed Trailer', 'Açık Kasa Dorse')}</option>
                    <option value="تریلی لبه‌دار (Drop-side)">{trText('تریلی لبه‌دار (Drop-side)', 'Drop-side Trailer', 'Yan Kapaklı Dorse')}</option>
                    <option value="تریلی کمپرسی (Tipper)">{trText('تریلی کمپرسی (Tipper)', 'Tipper Trailer', 'Damperli Dorse')}</option>
                    <option value="تریلی تانکر (Tanker)">{trText('تریلی تانکر (Tanker)', 'Tanker Trailer', 'Tanker Dorse')}</option>
                    <option value="کامیون جفت (۱۰ چرخ)">{trText('کامیون جفت (۱۰ چرخ)', 'Tandem Truck (10 wheels)', 'Çift Dingilli Kamyon (10 tekerlek)')}</option>
                    <option value="کامیون تک (۶ چرخ)">{trText('کامیون تک (۶ چرخ)', 'Single Truck (6 wheels)', 'Tek Dingilli Kamyon (6 tekerlek)')}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#444655]">{trText('برند خودرو', 'Vehicle Brand', 'Araç Markası')}</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs"
                  >
                    <option value="ولوو (Volvo)">{trText('ولوو (Volvo)', 'Volvo', 'Volvo')}</option>
                    <option value="اسکانیا (Scania)">{trText('اسکانیا (Scania)', 'Scania', 'Scania')}</option>
                    <option value="مرسدس بنز (Benz)">{trText('مرسدس بنز (Benz)', 'Mercedes-Benz (Benz)', 'Mercedes-Benz (Benz)')}</option>
                    <option value="داف (DAF)">{trText('داف (DAF)', 'DAF', 'DAF')}</option>
                    <option value="مان (MAN)">{trText('مان (MAN)', 'MAN', 'MAN')}</option>
                    <option value="رنو تراکس (Renault)">{trText('رنو تراکس (Renault)', 'Renault Trucks (Renault)', 'Renault Trucks (Renault)')}</option>
                    <option value="فاو (FAW)">{trText('فاو (FAW)', 'FAW', 'FAW')}</option>
                    <option value="فوتون (Foton)">{trText('فوتون (Foton)', 'Foton', 'Foton')}</option>
                    <option value="شاکمان (Shacman)">{trText('شاکمان (Shacman)', 'Shacman', 'Shacman')}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#444655]">{trText('مدل دقیق (تیپ)', 'Exact Model (Trim)', 'Tam Model (Tip)')}</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={trText('مثلاً FH 500 یا R450', 'e.g. FH 500 or R450', 'örn. FH 500 veya R450')}
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-[#444655]">{trText('سال ساخت (شمسی)', 'Build Year (Solar Hijri)', 'Üretim Yılı (Hicri Şemsi)')}</label>
                  <input
                    type="text"
                    value={buildYear}
                    onChange={(e) => setBuildYear(e.target.value)}
                    placeholder={trText('۱۴۰۱', '1401', '1401')}
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs font-jetbrains"
                  />
                </div>
              </div>

              {/* Iranian Plate Inputs */}
              <div className="p-3 bg-[#f0f4ff] rounded-xl border border-[#c4c5da]">
                <label className="font-bold text-[#00258e] block mb-2">{trText('شماره پلاک ایران', 'Iranian Plate Number', 'İran Plaka Numarası')}</label>
                <div className="grid grid-cols-4 gap-2 text-center" dir="ltr">
                  <div>
                    <span className="text-[10px] text-[#747686] block">{trText('دو رقم', 'Two digits', 'İki hane')}</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={platePart1}
                      onChange={(e) => setPlatePart1(e.target.value)}
                      placeholder={trText('۱۲', '12', '12')}
                      className="w-full h-10 bg-white border border-[#c4c5da] rounded-lg text-center font-jetbrains font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#747686] block">{trText('حرف', 'Letter', 'Harf')}</span>
                    <select
                      value={plateLetter}
                      onChange={(e) => setPlateLetter(e.target.value)}
                      className="w-full h-10 bg-white border border-[#c4c5da] rounded-lg text-center font-bold"
                    >
                      <option value="ع">{trText('ع (عمومی)', 'Ain (General)', 'Ayn (Genel)')}</option>
                      <option value="پ">{trText('پ (پلاک ویژه)', 'Pe (Special plate)', 'Pe (Özel plaka)')}</option>
                      <option value="ک">{trText('ک (کامیون)', 'Kaf (Truck)', 'Kaf (Kamyon)')}</option>
                      <option value="الف">{trText('الف', 'Alef', 'Elif')}</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#747686] block">{trText('سه رقم', 'Three digits', 'Üç hane')}</span>
                    <input
                      type="text"
                      maxLength={3}
                      value={platePart2}
                      onChange={(e) => setPlatePart2(e.target.value)}
                      placeholder={trText('۳۴۵', '345', '345')}
                      className="w-full h-10 bg-white border border-[#c4c5da] rounded-lg text-center font-jetbrains font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#747686] block">{trText('کد ایران', 'Iran Code', 'İran Kodu')}</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={plateIranCode}
                      onChange={(e) => setPlateIranCode(e.target.value)}
                      placeholder={trText('۶۸', '68', '68')}
                      className="w-full h-10 bg-white border border-[#c4c5da] rounded-lg text-center font-jetbrains font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#444655]">{trText('ظرفیت تناژ مجاز (تن)', 'Permissible Tonnage (tons)', 'İzin Verilen Tonaj (ton)')}</label>
                  <input
                    type="number"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(e.target.value)}
                    placeholder={trText('۲۴', '24', '24')}
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs font-jetbrains"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#444655]">{trText('کارت هوشمند ناوگان', 'Fleet Smart Card', 'Filo Akıllı Kartı')}</label>
                  <input
                    type="text"
                    value={smartCardTruck}
                    onChange={(e) => setSmartCardTruck(e.target.value)}
                    placeholder={trText('۹۹۲۱۴۸۵', '9921485', '9921485')}
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs font-jetbrains"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#444655]">{trText('شماره شاسی (VIN)', 'Chassis Number (VIN)', 'Şasi Numarası (VIN)')}</label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    placeholder="YV2AZ02..."
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs font-jetbrains"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#444655]">{trText('شماره موتور', 'Engine Number', 'Motor Numarası')}</label>
                  <input
                    type="text"
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value)}
                    placeholder="D13K..."
                    className="w-full h-11 bg-[#fbf8ff] border border-[#c4c5da] rounded-xl px-3 mt-1 outline-none text-xs font-jetbrains"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-[#eeedf9] text-[#444655] font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'İptal')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00258e] text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#0036c5]"
                >
                  {trText('ثبت اطلاعات خودرو', 'Save Vehicle Details', 'Araç Bilgilerini Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
