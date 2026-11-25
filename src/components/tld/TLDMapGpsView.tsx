import React from 'react';
import { TLDSensorMetrics } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface TLDMapGpsViewProps {
  metrics: TLDSensorMetrics;
  onSelectCheckpoint?: (name: string) => void;
}

export const TLDMapGpsView: React.FC<TLDMapGpsViewProps> = ({ metrics }) => {
  const { trText } = useLanguage();

  const checkpoints = [
    { name: 'مبدأ: تهران (شمس‌آباد)', km: 0, time: '۱۰:۰۰', passed: true, lat: 35.345, lng: 51.234 },
    { name: 'گرمسار', km: 110, time: '۱۲:۰۰', passed: true, lat: 35.215, lng: 52.341 },
    { name: 'سمنان', km: 220, time: '۱۴:۰۰', passed: true, lat: 35.572, lng: 53.397 },
    { name: 'دامغان', km: 335, time: '۱۵:۰۰', passed: true, lat: 36.168, lng: 54.348 },
    { name: 'موقعیت زنده (شاهرود)', km: 470, time: 'هم‌اکنون', passed: true, isCurrent: true, lat: metrics.currentLat, lng: metrics.currentLng },
    { name: 'میامی', km: 530, time: '۱۷:۳۰', passed: false, lat: 36.411, lng: 55.654 },
    { name: 'سبزوار', km: 650, time: '۱۹:۰۰', passed: false, lat: 36.213, lng: 57.678 },
    { name: 'نیشابور', km: 775, time: '۲۰:۱۵', passed: false, lat: 36.213, lng: 58.795 },
    { name: 'مقصد: مشهد (شهرک توس)', km: 890, time: '۲۱:۳۰', passed: false, lat: 36.297, lng: 59.606 },
  ];

  const progressPercent = Math.min(100, Math.round((metrics.distanceCoveredKm / metrics.totalJourneyKm) * 100));

  return (
    <div className="space-y-4">
      {/* Interactive Map Stage */}
      <div className="bg-white rounded-3xl border border-[#c4c5da] overflow-hidden shadow-sm relative h-[440px] md:h-[500px]">
        {/* Map Vector Simulated Canvas */}
        <div className="absolute inset-0 bg-[#e3e9ee] flex items-center justify-center overflow-hidden select-none">
          {/* Topographic and road grid lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(#00258e 1px, transparent 1px), radial-gradient(#00258e 1px, #e3e9ee 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* SVG Roads and Geofence Buffer */}
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 900 500" preserveAspectRatio="none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a368" />
                <stop offset="55%" stopColor="#00a368" />
                <stop offset="55%" stopColor="#00258e" />
                <stop offset="100%" stopColor="#747686" />
              </linearGradient>
              <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Geofence Corridor Buffer (Safe Zone) */}
            <path
              d="M 80 340 Q 240 310, 360 250 T 620 210 T 820 120"
              fill="none"
              stroke="#00a368"
              strokeWidth="48"
              strokeOpacity="0.12"
              strokeLinecap="round"
            />

            {/* Highway Asphalt Road */}
            <path
              d="M 80 340 Q 240 310, 360 250 T 620 210 T 820 120"
              fill="none"
              stroke="#ffffff"
              strokeWidth="20"
              strokeLinecap="round"
              filter="url(#shadow)"
            />

            {/* Road Traveled Path */}
            <path
              d="M 80 340 Q 240 310, 360 250 T 490 226"
              fill="none"
              stroke="#00a368"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Road Remaining Path */}
            <path
              d="M 490 226 T 620 210 T 820 120"
              fill="none"
              stroke="#00258e"
              strokeWidth="6"
              strokeDasharray="8 6"
              strokeLinecap="round"
            />

            {/* Secondary Intersections */}
            <path d="M 360 250 L 390 100" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="4 4" />
            <path d="M 620 210 L 680 380" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="4 4" />
          </svg>

          {/* Map City Labels & Waypoint Markers */}
          {/* Origin: Tehran */}
          <div className="absolute left-[8%] bottom-[26%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#00258e] text-white flex items-center justify-center shadow-md border-2 border-white">
              <span className="material-symbols-outlined text-[16px]">warehouse</span>
            </div>
            <span className="text-[10px] font-bold bg-white/95 px-2 py-0.5 rounded shadow mt-1 border border-[#c4c5da]">
              {trText('مبدأ: تهران', 'Origin: Tehran', 'Kalkış: Tahran')}
            </span>
          </div>

          {/* Semnan Checkpoint */}
          <div className="absolute left-[38%] top-[45%] flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#00a368] text-white flex items-center justify-center shadow-sm border border-white text-[10px] font-bold">
              ✓
            </div>
            <span className="text-[9px] font-medium bg-white/90 px-1.5 py-0.5 rounded shadow mt-0.5">
              {trText('سمنان', 'Semnan', 'Semnan')}
            </span>
          </div>

          {/* Live Vehicle Pulse Marker */}
          <div className="absolute left-[52%] top-[40%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
            {/* Radar wave ping */}
            <div className="w-16 h-16 rounded-full bg-[#00a368]/20 animate-ping absolute -top-2" />
            <div className="w-12 h-12 rounded-2xl bg-[#00258e] text-white flex items-center justify-center shadow-2xl border-2 border-white relative z-10">
              <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              {/* Compass heading indicator dot */}
              <div
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00a368] border border-white"
                title={trText(`سمت حرکت: ${metrics.headingDegrees}°`, `Heading: ${metrics.headingDegrees}°`, `Yön: ${metrics.headingDegrees}°`)}
              />
            </div>
            <div className="bg-[#1a1b23] text-white text-[11px] font-jetbrains font-bold px-2.5 py-0.5 rounded-lg shadow-lg mt-1.5 flex items-center gap-1 z-10 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#00a368] animate-pulse" />
              <span>{metrics.currentSpeedKmH} km/h</span>
            </div>
          </div>

          {/* Destination: Mashhad */}
          <div className="absolute right-[8%] top-[20%] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-md border-2 border-white">
              <span className="material-symbols-outlined text-[16px]">flag</span>
            </div>
            <span className="text-[10px] font-bold bg-white/95 px-2 py-0.5 rounded shadow mt-1 border border-[#c4c5da]">
              {trText('مقصد: مشهد', 'Destination: Mashhad', 'Varış: Meşhed')}
            </span>
          </div>

          {/* Top HUD Floating Widget: GPS Telemetry Specs */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#c4c5da] shadow-md flex items-center gap-3 text-xs pointer-events-auto">
              <div className="flex items-center gap-1.5 font-bold text-[#00258e]">
                <span className="material-symbols-outlined text-[18px] text-[#00a368]">satellite_alt</span>
                <span>{trText('پخش زنده ماهواره‌ای GPS', 'Live GPS Satellite Feed', 'Canlı GPS Uydu Yayını')}</span>
              </div>
              <div className="h-4 w-px bg-[#c4c5da]" />
              <div className="text-[11px] text-[#545f72] font-jetbrains">
                {trText('مختصات:', 'Coordinates:', 'Koordinatlar:')} {metrics.currentLat.toFixed(4)}°N, {metrics.currentLng.toFixed(4)}°E
              </div>
              <div className="hidden sm:block text-[11px] text-[#545f72] font-jetbrains">
                {trText('ارتفاع:', 'Altitude:', 'Rakım:')} {metrics.altitudeMeters}m
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#c4c5da] shadow-md flex items-center gap-2 text-xs pointer-events-auto">
              <span className="material-symbols-outlined text-[18px] text-[#00a368]">wb_sunny</span>
              <span className="font-bold text-[#1a1b23]">{trText('آب و هوای مسیر:', 'Route weather:', 'Güzergâh hava durumu:')}</span>
              <span className="text-[#545f72] font-jetbrains">{trText('آفتابی ۳۱°C - باد آرام', 'Sunny 31°C - calm wind', 'Güneşli 31°C - hafif rüzgar')}</span>
            </div>
          </div>

          {/* Bottom Floating Card: Trip Progress & ETA */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#c4c5da] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#1a1b23] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#00258e] text-[18px]">route</span>
                  <span>{trText(`پیشرفت مسیر جاده‌ای (${progressPercent}٪ طی شده)`, `Road trip progress (${progressPercent}% completed)`, `Yolculuk ilerlemesi (%${progressPercent} tamamlandı)`)}</span>
                </span>
                <span className="font-jetbrains font-bold text-[#00258e]">
                  {trText(`${metrics.distanceCoveredKm} از ${metrics.totalJourneyKm} کیلومتر`, `${metrics.distanceCoveredKm} of ${metrics.totalJourneyKm} km`, `${metrics.totalJourneyKm} km'nin ${metrics.distanceCoveredKm} km'si`)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#eeedf9] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#00a368] to-[#00258e] h-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-5 border-t md:border-t-0 md:border-r border-[#e2e1ed] pt-2 md:pt-0 md:pr-5 shrink-0">
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('مسافت باقیمانده:', 'Remaining distance:', 'Kalan mesafe:')}</span>
                <span className="font-jetbrains font-black text-sm text-[#1a1b23]">
                  {trText(`${metrics.distanceRemainingKm} کیلومتر`, `${metrics.distanceRemainingKm} km`, `${metrics.distanceRemainingKm} km`)}
                </span>
              </div>
              <div>
                <span className="text-[#747686] text-[10px] block">{trText('زمان تخمینی وصول (ETA):', 'Estimated time of arrival (ETA):', 'Tahmini varış zamanı (ETA):')}</span>
                <span className="font-jetbrains font-black text-sm text-[#00a368]">
                  {metrics.etaTimeFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoints Horizontal Stepper */}
      <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00258e]">linear_scale</span>
            <span>{trText('ایستگاه‌ها، عوارضی‌ها و ایست‌های بازرسی مسیر (Route Checkpoints)', 'Route Checkpoints, Tolls & Inspection Stations', 'Güzergâh Kontrol Noktaları, Gişeler ve Denetim İstasyonları')}</span>
          </h3>
          <span className="text-xs text-[#00a368] font-bold bg-[#00a368]/10 px-2.5 py-0.5 rounded-full">
            {trText(`دالان ژئوفنس فعال (خطا: ${metrics.geofenceDeviationMeters} متر)`, `Active geofence corridor (deviation: ${metrics.geofenceDeviationMeters} m)`, `Aktif jeofence koridoru (sapma: ${metrics.geofenceDeviationMeters} m)`)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {checkpoints.map((cp, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                cp.isCurrent
                  ? 'bg-[#00258e]/5 border-[#00258e] ring-2 ring-[#00258e]/20'
                  : cp.passed
                  ? 'bg-[#fbf8ff] border-[#c4c5da]'
                  : 'bg-[#fafafa] border-[#e2e1ed] opacity-75'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    cp.isCurrent
                      ? 'bg-[#00258e] text-white animate-pulse'
                      : cp.passed
                      ? 'bg-[#00a368] text-white'
                      : 'bg-[#eeedf9] text-[#747686]'
                  }`}
                >
                  {cp.isCurrent ? '📍' : cp.passed ? '✓' : idx + 1}
                </div>
                <div>
                  <div className="font-bold text-[#1a1b23]">{trText(cp.name)}</div>
                  <div className="text-[10px] text-[#545f72] font-jetbrains">
                    {trText(`کیلومتر ${cp.km} • ${cp.time}`, `km ${cp.km} • ${cp.time}`, `${cp.km}. km • ${cp.time}`)}
                  </div>
                </div>
              </div>

              <div>
                {cp.isCurrent ? (
                  <span className="bg-[#00258e] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {trText('موقعیت فعلی', 'Current location', 'Mevcut konum')}
                  </span>
                ) : cp.passed ? (
                  <span className="text-[#00a368] font-bold text-[11px]">{trText('عبور موفق', 'Passed', 'Geçildi')}</span>
                ) : (
                  <span className="text-[#747686] text-[11px]">{trText('در پیش رو', 'Upcoming', 'İleride')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
