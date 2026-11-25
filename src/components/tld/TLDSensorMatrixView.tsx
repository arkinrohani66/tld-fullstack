import React from 'react';
import { TLDSensorMetrics } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface TLDSensorMatrixViewProps {
  metrics: TLDSensorMetrics;
}

export const TLDSensorMatrixView: React.FC<TLDSensorMatrixViewProps> = ({ metrics }) => {
  const { trText } = useLanguage();

  const isTempOptimal =
    metrics.tempZone1Front >= metrics.minAllowedTempCelsius &&
    metrics.tempZone1Front <= metrics.maxAllowedTempCelsius &&
    metrics.tempZone2Middle <= metrics.maxAllowedTempCelsius &&
    metrics.tempZone3Rear <= metrics.maxAllowedTempCelsius;

  const isSpeedSafe = metrics.currentSpeedKmH <= metrics.speedLimitKmH;

  return (
    <div className="space-y-6">
      {/* Top 4 Core Highlight KPI Cards (Temperature, Weight, Speed, ETA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Temperature KPI Card */}
        <div
          className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            isTempOptimal ? 'border-[#c4c5da]' : 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/20 bg-[#ffdad6]/10'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isTempOptimal ? 'bg-[#0288d1]/10 text-[#0288d1]' : 'bg-[#ba1a1a]/15 text-[#ba1a1a]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">ac_unit</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#545f72] block">{trText('دمای محفظه بار', 'Cargo compartment temperature', 'Kargo bölmesi sıcaklığı')}</span>
                <span className="text-[10px] text-[#747686]">{trText('زنجیره سرد (Cold Chain)', 'Cold chain', 'Soğuk zincir (Cold Chain)')}</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isTempOptimal ? 'bg-[#00a368]/15 text-[#00a368]' : 'bg-[#ba1a1a] text-white animate-pulse'
              }`}
            >
              {isTempOptimal ? trText('محدوده ایمن', 'Safe range', 'Güvenli aralık') : trText('هشدار دما!', 'Temperature alert!', 'Sıcaklık uyarısı!')}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-jetbrains text-[#1a1b23]">
                {metrics.tempZone2Middle}
              </span>
              <span className="text-sm font-bold text-[#545f72] mr-1">°C</span>
            </div>
            <div className="text-left text-[11px] text-[#545f72]">
              <div>{trText('هدف:', 'Target:', 'Hedef:')} <strong className="font-jetbrains text-[#1a1b23]">{metrics.targetTempCelsius}°C</strong></div>
              <div>{trText('محدوده:', 'Range:', 'Aralık:')} <span className="font-jetbrains text-[10px]">{trText(`${metrics.minAllowedTempCelsius} تا ${metrics.maxAllowedTempCelsius}`, `${metrics.minAllowedTempCelsius} to ${metrics.maxAllowedTempCelsius}`, `${metrics.minAllowedTempCelsius} – ${metrics.maxAllowedTempCelsius}`)}</span></div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#e2e1ed] flex justify-between text-[11px] text-[#545f72]">
            <span>{trText('دمای محیط بیرون:', 'Outside ambient temperature:', 'Dış ortam sıcaklığı:')}</span>
            <span className="font-jetbrains font-bold text-[#1a1b23]">+{metrics.tempAmbientExternal} °C</span>
          </div>
        </div>

        {/* 2. Weight KPI Card */}
        <div
          className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            !metrics.isWeightAnomalyDetected ? 'border-[#c4c5da]' : 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/20 bg-[#ffdad6]/10'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">scale</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#545f72] block">{trText('وزن و تناژ محموله', 'Cargo weight & tonnage', 'Kargo ağırlığı ve tonajı')}</span>
                <span className="text-[10px] text-[#747686]">{trText('لودسل‌های تعلیق هوا', 'Air suspension load cells', 'Hava süspansiyon yük hücreleri')}</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                !metrics.isWeightAnomalyDetected ? 'bg-[#00a368]/15 text-[#00a368]' : 'bg-[#ba1a1a] text-white animate-pulse'
              }`}
            >
              {!metrics.isWeightAnomalyDetected ? trText('ثابت و پایدار', 'Stable', 'Sabit ve kararlı') : trText('تغییر غیرعادی!', 'Abnormal change!', 'Anormal değişim!')}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-jetbrains text-[#00258e]">
                {metrics.netCargoWeightTons}
              </span>
              <span className="text-sm font-bold text-[#545f72] mr-1">{trText('تن بار خالص', 'net tons of cargo', 'ton net kargo')}</span>
            </div>
            <div className="text-left text-[11px] text-[#545f72]">
              <div>{trText('کل ناخالص:', 'Gross total:', 'Brüt toplam:')} <strong className="font-jetbrains text-[#1a1b23]">{metrics.grossTotalWeightTons}T</strong></div>
              <div>{trText('انحراف تعادل:', 'Balance deviation:', 'Denge sapması:')} <span className="font-jetbrains font-bold text-[#00a368]">{metrics.loadBalanceDeviationPercent}{trText('٪', '%', '%')}</span></div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#e2e1ed] flex justify-between text-[11px] text-[#545f72]">
            <span>{trText('باسکول مبدأ:', 'Origin weighbridge:', 'Kalkış kantarı:')}</span>
            <span className="font-jetbrains font-bold text-[#1a1b23]">{trText('۲۲.۵۰ تن (تطابق ۱۰۰٪)', '22.50 t (100% match)', '22,50 ton (%100 eşleşme)')}</span>
          </div>
        </div>

        {/* 3. Speed & Telematics Card */}
        <div
          className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
            isSpeedSafe ? 'border-[#c4c5da]' : 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/20 bg-[#ffdad6]/10'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#00a368]/10 text-[#00a368] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">speed</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#545f72] block">{trText('سرعت لحظه‌ای', 'Instant speed', 'Anlık hız')}</span>
                <span className="text-[10px] text-[#747686]">{trText('داده‌برداری GPS و CAN-Bus', 'GPS & CAN-Bus data capture', 'GPS ve CAN-Bus veri toplama')}</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSpeedSafe ? 'bg-[#00a368]/15 text-[#00a368]' : 'bg-[#ba1a1a] text-white animate-pulse'
              }`}
            >
              {isSpeedSafe ? trText('سرعت مجاز', 'Speed within limit', 'İzin verilen hız') : trText('سرعت غیرمجاز!', 'Overspeeding!', 'Hız ihlali!')}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-jetbrains text-[#1a1b23]">
                {metrics.currentSpeedKmH}
              </span>
              <span className="text-sm font-bold text-[#545f72] mr-1">km/h</span>
            </div>
            <div className="text-left text-[11px] text-[#545f72]">
              <div>{trText('حداکثر مجاز:', 'Max allowed:', 'İzin verilen maksimum:')} <strong className="font-jetbrains text-[#1a1b23]">{metrics.speedLimitKmH} km/h</strong></div>
              <div>{trText('شتاب جانبی:', 'Lateral acceleration:', 'Yanal ivme:')} <span className="font-jetbrains font-bold text-[#00258e]">{metrics.instantGForce} G</span></div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#e2e1ed] flex justify-between text-[11px] text-[#545f72]">
            <span>{trText('ترمز یا شتاب ناگهانی:', 'Harsh braking / acceleration:', 'Sert fren veya hızlanma:')}</span>
            <span className="font-bold text-[#00a368]">
              {metrics.harshBrakingDetected ? trText('⚠️ ترمز شدید ثبت شد', '⚠️ Hard braking recorded', '⚠️ Sert fren kaydedildi') : trText('رفتار رانندگی مطلوب', 'Good driving behavior', 'Olumlu sürüş davranışı')}
            </span>
          </div>
        </div>

        {/* 4. ETA & Distance Remaining Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#c4c5da] shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#6750a4]/10 text-[#6750a4] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#545f72] block">{trText('زمان تخمینی وصول (ETA)', 'Estimated time of arrival (ETA)', 'Tahmini varış zamanı (ETA)')}</span>
                <span className="text-[10px] text-[#747686]">{trText('محاسبه هوشمند با ترافیک', 'Smart traffic-aware estimate', 'Trafik duyarlı akıllı hesaplama')}</span>
              </div>
            </div>
            <span className="bg-[#6750a4]/15 text-[#6750a4] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {trText('آن‌تایم', 'On time', 'Zamanında')}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-jetbrains text-[#6750a4]">
                {Math.floor(metrics.etaRemainingMinutes / 60)}:{(metrics.etaRemainingMinutes % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-xs font-bold text-[#545f72] mr-1">{trText('ساعت مانده', 'hours remaining', 'saat kaldı')}</span>
            </div>
            <div className="text-left text-[11px] text-[#545f72]">
              <div>{trText('باقیمانده:', 'Remaining:', 'Kalan:')} <strong className="font-jetbrains text-[#1a1b23]">{metrics.distanceRemainingKm} km</strong></div>
              <div>{trText('طی‌شده:', 'Covered:', 'Katedilen:')} <span className="font-jetbrains font-bold text-[#00a368]">{metrics.distanceCoveredKm} km</span></div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#e2e1ed] flex justify-between text-[11px] text-[#545f72]">
            <span>{trText('ساعت پیش‌بینی تحویل:', 'Estimated delivery time:', 'Tahmini teslim saati:')}</span>
            <span className="font-jetbrains font-bold text-[#1a1b23]">{trText('ساعت ۲۱:۳۰ امشب', '21:30 tonight', 'Bu gece 21:30')}</span>
          </div>
        </div>
      </div>

      {/* Detailed Sensor Deep-Dives (Multi-Zone Temperature & Axle Load Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Zone Temperature Chamber Monitor */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
            <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0288d1]">device_thermostat</span>
              <span>{trText('پایش دمای چند نقطه‌ای محفظه بار (Multi-Zone Cold Chain)', 'Multi-Zone Cargo Compartment Temperature Monitoring', 'Çok Bölgeli Kargo Bölmesi Sıcaklık İzleme (Multi-Zone Cold Chain)')}</span>
            </h3>
            <span className="text-[11px] text-[#545f72] font-jetbrains">{trText('سنسورهای بی‌سیم BLE 5.2', 'BLE 5.2 wireless sensors', 'BLE 5.2 kablosuz sensörler')}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Zone 1: Front */}
            <div className="p-3.5 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <span className="text-[10px] text-[#747686] block">{trText('زون ۱ (جلو - کنار یونیت)', 'Zone 1 (front - next to unit)', 'Bölge 1 (ön - ünitenin yanı)')}</span>
              <div className="text-2xl font-black font-jetbrains text-[#0288d1]">
                {metrics.tempZone1Front}°C
              </div>
              <span className="text-[10px] font-bold text-[#00a368] bg-[#00a368]/10 px-2 py-0.5 rounded">
                {trText('نرمال', 'Normal', 'Normal')}
              </span>
            </div>

            {/* Zone 2: Middle */}
            <div className="p-3.5 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <span className="text-[10px] text-[#747686] block">{trText('زون ۲ (مرکز کانتینر)', 'Zone 2 (container center)', 'Bölge 2 (konteyner merkezi)')}</span>
              <div className="text-2xl font-black font-jetbrains text-[#0288d1]">
                {metrics.tempZone2Middle}°C
              </div>
              <span className="text-[10px] font-bold text-[#00a368] bg-[#00a368]/10 px-2 py-0.5 rounded">
                {trText('نرمال', 'Normal', 'Normal')}
              </span>
            </div>

            {/* Zone 3: Rear */}
            <div className="p-3.5 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <span className="text-[10px] text-[#747686] block">{trText('زون ۳ (عقب - کنار درب)', 'Zone 3 (rear - next to door)', 'Bölge 3 (arka - kapının yanı)')}</span>
              <div
                className={`text-2xl font-black font-jetbrains ${
                  metrics.tempZone3Rear <= metrics.maxAllowedTempCelsius ? 'text-[#0288d1]' : 'text-[#ba1a1a]'
                }`}
              >
                {metrics.tempZone3Rear}°C
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  metrics.tempZone3Rear <= metrics.maxAllowedTempCelsius
                    ? 'text-[#00a368] bg-[#00a368]/10'
                    : 'text-[#ba1a1a] bg-[#ba1a1a]/15 animate-pulse'
                }`}
              >
                {metrics.tempZone3Rear <= metrics.maxAllowedTempCelsius ? trText('نرمال', 'Normal', 'Normal') : trText('احتیاط', 'Caution', 'Dikkat')}
              </span>
            </div>
          </div>

          {/* Visual Thermometer Range Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] text-[#545f72]">
              <span>{trText(`حد حداقل: ${metrics.minAllowedTempCelsius}°C`, `Min limit: ${metrics.minAllowedTempCelsius}°C`, `Alt sınır: ${metrics.minAllowedTempCelsius}°C`)}</span>
              <span className="font-bold text-[#00258e]">{trText('محدوده مجاز نگهداری کالا', 'Permissible cargo storage range', 'İzin verilen kargo saklama aralığı')}</span>
              <span>{trText(`حد حداکثر: ${metrics.maxAllowedTempCelsius}°C`, `Max limit: ${metrics.maxAllowedTempCelsius}°C`, `Üst sınır: ${metrics.maxAllowedTempCelsius}°C`)}</span>
            </div>
            <div className="w-full bg-[#eeedf9] rounded-full h-3 overflow-hidden relative">
              {/* Safe zone overlay */}
              <div className="absolute inset-y-0 right-[25%] left-[25%] bg-[#00a368]/20 border-x border-[#00a368]/40" />
              {/* Current indicator marker */}
              <div
                className="absolute top-0 bottom-0 w-2.5 bg-[#00258e] rounded-full -translate-x-1/2 transition-all duration-500 shadow"
                style={{ left: '42%' }}
              />
            </div>
          </div>
        </div>

        {/* Axle Load Distribution & Balance */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
            <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e]">rv_hookup</span>
              <span>{trText('توزیع بار روی محورها و پایش تعادل (Axle Load Cells)', 'Axle Load Distribution & Balance Monitoring (Axle Load Cells)', 'Aks Yük Dağılımı ve Denge İzleme (Axle Load Cells)')}</span>
            </h3>
            <span className="text-[11px] text-[#545f72] font-jetbrains">{trText('سنسورهای فشار باد پنوماتیک', 'Pneumatic air pressure sensors', 'Pnömatik hava basınç sensörleri')}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Steer Axle */}
            <div className="p-3.5 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <span className="text-[10px] text-[#747686] block">{trText('محور فرمان (جلو)', 'Steer axle (front)', 'Direksiyon aksı (ön)')}</span>
              <div className="text-xl font-black font-jetbrains text-[#1a1b23]">
                {metrics.steerAxleWeightTons} <span className="text-xs font-normal">{trText('تن', 't', 'ton')}</span>
              </div>
              <span className="text-[10px] text-[#545f72] block">{trText('مجاز: تا ۶.۵ تن', 'Allowed: up to 6.5 t', 'İzin verilen: 6,5 tona kadar')}</span>
            </div>

            {/* Drive Tandem */}
            <div className="p-3.5 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <span className="text-[10px] text-[#747686] block">{trText('محور محرک (دیفرانسیل)', 'Drive axle (differential)', 'Tahrik aksı (diferansiyel)')}</span>
              <div className="text-xl font-black font-jetbrains text-[#1a1b23]">
                {metrics.driveTandemWeightTons} <span className="text-xs font-normal">{trText('تن', 't', 'ton')}</span>
              </div>
              <span className="text-[10px] text-[#545f72] block">{trText('مجاز: تا ۱۱.۵ تن', 'Allowed: up to 11.5 t', 'İzin verilen: 11,5 tona kadar')}</span>
            </div>

            {/* Trailer Tri-Axle */}
            <div className="p-3.5 rounded-xl bg-[#fbf8ff] border border-[#e2e1ed] space-y-1">
              <span className="text-[10px] text-[#747686] block">{trText('محورهای سه‌گانه تریلر', 'Trailer tri-axle', 'Treyler üçlü aksı')}</span>
              <div className="text-xl font-black font-jetbrains text-[#00258e]">
                {metrics.trailerTriAxleWeightTons} <span className="text-xs font-normal">{trText('تن', 't', 'ton')}</span>
              </div>
              <span className="text-[10px] text-[#545f72] block">{trText('مجاز: تا ۲۴.۰ تن', 'Allowed: up to 24.0 t', 'İzin verilen: 24,0 tona kadar')}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#eeedf9] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00258e] text-[18px]">balance</span>
              <span className="text-[#1a1b23] font-bold">{trText('توازن جانبی محموله:', 'Cargo lateral balance:', 'Kargo yanal dengesi:')}</span>
            </div>
            <span className="font-jetbrains font-bold text-[#00a368]">
              {trText(`${metrics.loadBalanceDeviationPercent}٪ انحراف (کاملاً ایمن و متقارن)`, `${metrics.loadBalanceDeviationPercent}% deviation (fully safe & balanced)`, `%${metrics.loadBalanceDeviationPercent} sapma (tamamen güvenli ve dengeli)`)}
            </span>
          </div>
        </div>
      </div>

      {/* Atmospheric, Environmental & Security Sensor Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Humidity */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm space-y-1 text-center">
          <div className="w-8 h-8 rounded-lg bg-[#0288d1]/10 text-[#0288d1] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[18px]">humidity_percentage</span>
          </div>
          <span className="text-[11px] text-[#545f72] block">{trText('رطوبت نسبی محفظه', 'Compartment relative humidity', 'Bölme bağıl nemi')}</span>
          <div className="text-xl font-black font-jetbrains text-[#1a1b23]">{metrics.relativeHumidityPercent}%</div>
          <span className="text-[10px] text-[#00a368] font-bold">{trText('مطلوب', 'Optimal', 'İdeal')}</span>
        </div>

        {/* Barometric Pressure */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm space-y-1 text-center">
          <div className="w-8 h-8 rounded-lg bg-[#6750a4]/10 text-[#6750a4] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[18px]">compress</span>
          </div>
          <span className="text-[11px] text-[#545f72] block">{trText('فشار بارومتری هوا', 'Barometric air pressure', 'Barometrik hava basıncı')}</span>
          <div className="text-xl font-black font-jetbrains text-[#1a1b23]">{metrics.barometricPressureHpa} hPa</div>
          <span className="text-[10px] text-[#545f72]">{trText('ارتفاع ۱۱۴۰ متر', 'Altitude 1140 m', 'Rakım 1140 m')}</span>
        </div>

        {/* Optical Light Detector in Hold */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm space-y-1 text-center">
          <div className="w-8 h-8 rounded-lg bg-[#00a368]/10 text-[#00a368] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          </div>
          <span className="text-[11px] text-[#545f72] block">{trText('سنسور نوری داخل کانتینر', 'Interior light sensor', 'Konteyner içi ışık sensörü')}</span>
          <div className="text-xl font-black font-jetbrains text-[#1a1b23]">0.2 Lux</div>
          <span className="text-[10px] text-[#00a368] font-bold">{trText('تاریک (درب‌ها کاملاً بسته)', 'Dark (doors fully closed)', 'Karanlık (kapılar tamamen kapalı)')}</span>
        </div>

        {/* Smart E-Seal Cable Resistance */}
        <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm space-y-1 text-center">
          <div className="w-8 h-8 rounded-lg bg-[#00258e]/10 text-[#00258e] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[18px]">lock_clock</span>
          </div>
          <span className="text-[11px] text-[#545f72] block">{trText('مقاومت لوپ پلمپ دیجیتال', 'Digital seal loop resistance', 'Dijital mühür döngü direnci')}</span>
          <div className="text-xl font-black font-jetbrains text-[#00258e]">{metrics.eLockCableLoopResistanceOhms} Ω</div>
          <span className="text-[10px] text-[#00a368] font-bold">{trText('پیوستگی الکتریکی ۱۰۰٪', '100% electrical continuity', '%100 elektriksel süreklilik')}</span>
        </div>
      </div>
    </div>
  );
};
