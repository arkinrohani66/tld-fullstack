import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { DataComponent } from '../components/ui/DataComponent';

interface TripsScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const TripsScreen: React.FC<TripsScreenProps> = ({ onNavigate }) => {
  const { role } = useAuth();
  const { dir, trText } = useLanguage();
  const { trips, selectedTripId, setSelectedTripId, setSelectedCargoId } = useLogistics();

  const trip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const nowStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const homeScreen: AppScreen = role === 'SHIPPER' ? 'SHIPPER_DASHBOARD' : 'DRIVER_DASHBOARD';

  // ---------- Empty state (no trips recorded yet) ----------
  if (!trip) {
    return (
      <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
        <AppHeader
          currentScreen="TRIPS"
          title={trText('مدیریت سفرها و ناوگان', 'Trips & Fleet Management', 'Seferler ve Filo Yönetimi')}
          subtitle="Live Fleet Navigation & Telemetry"
          showBack={true}
          onBack={() => onNavigate(homeScreen)}
          onNavigate={onNavigate}
        />
        <DesktopSidebar currentScreen="TRIPS" onNavigate={onNavigate} />
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c5da] shadow-sm">
            <span className="material-symbols-outlined text-4xl text-[#747686]">route</span>
            <h3 className="text-sm font-bold text-[#1a1b23] mt-3">{trText('هنوز سفری ثبت نشده است', 'No trips recorded yet', 'Henüz kayıtlı sefer yok')}</h3>
            <p className="text-xs text-[#545f72] mt-1">
              {trText('سفرها پس از تخصیص راننده به محموله به‌صورت خودکار در همین صفحه نمایش داده می‌شوند.', 'Trips appear on this page automatically once a driver is assigned to a cargo.', 'Bir yüke sürücü atandığında seferler bu sayfada otomatik olarak görüntülenir.')}
            </p>
          </div>
        </main>
        <MobileBottomNav currentScreen="TRIPS" onNavigate={onNavigate} />
      </div>
    );
  }

  const speedReading = {
    value: trip.currentSpeedKmH,
    unit: 'km/h',
    status: 'LIVE' as const,
    timestamp: nowStr(),
    source: 'TLD_TRIP_REGISTRY',
  };

  const routeReading = {
    value: `${trip.origin} → ${trip.destination}`,
    unit: trText('مسیر فعال', 'Active route', 'Aktif rota'),
    status: 'LIVE' as const,
    timestamp: nowStr(),
    source: 'TLD_TRIP_REGISTRY',
  };

  const distanceReading = {
    value: trip.distanceRemainingKm,
    unit: 'km remaining',
    status: 'LIVE' as const,
    timestamp: nowStr(),
    source: 'ROUTING_ENGINE',
  };

  const etaReading = {
    value: trip.eta || '—',
    unit: 'Estimated Arrival',
    status: 'LIVE' as const,
    timestamp: nowStr(),
    source: 'TLD_TRIP_REGISTRY',
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      {/* Top App Bar */}
      <AppHeader
        currentScreen="TRIPS"
        title={trText('مدیریت سفرها و ناوگان', 'Trips & Fleet Management', 'Seferler ve Filo Yönetimi')}
        subtitle="Live Fleet Navigation & Telemetry"
        showBack={true}
        onBack={() => onNavigate(homeScreen)}
        onNavigate={onNavigate}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar currentScreen="TRIPS" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="font-vazirmatn text-2xl md:text-3xl font-extrabold text-[#1a1b23]">
              {trText('رهگیری زنده و سفرها', 'Live Tracking & Trips', 'Canlı Takip ve Seferler')}
            </h1>
            <p className="text-[#545f72] text-xs md:text-sm mt-1">
              {trText('پایش لحظه‌ای سرعت، موقعیت مکانی GNSS، مسافت و وضعیت سنسورها', 'Real-time monitoring of speed, GNSS position, distance and sensor status', 'Hız, GNSS konumu, mesafe ve sensör durumunun anlık izlenmesi')}
            </p>
          </div>

          <div className="flex gap-2">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTripId(t.id)}
                className={`px-3.5 py-1.5 rounded-xl font-jetbrains text-xs font-bold transition-all cursor-pointer ${
                  t.id === trip.id
                    ? 'bg-[#00258e] text-white shadow-sm'
                    : 'bg-white text-[#444655] border border-[#c4c5da] hover:bg-[#eeedf9]'
                }`}
                dir="ltr"
              >
                {t.id}
              </button>
            ))}
          </div>
        </div>

        {/* Active Trip Banner */}
        <div className="bg-[#00258e] text-white p-5 md:p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <span className="material-symbols-outlined text-3xl">route</span>
            </div>
            <div>
              <div className="font-jetbrains text-[11px] text-[#a6b4ff] uppercase font-bold" dir="ltr">
                ACTIVE VOYAGE • {trip.id}
              </div>
              <div className="font-vazirmatn text-base md:text-lg font-bold">
                {trip.origin} ← {trip.destination}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4" dir="ltr">
            <div className="text-end">
              <div className="font-jetbrains text-2xl font-extrabold text-[#00d4ff]">
                {trip.currentSpeedKmH} KM/H
              </div>
              <div className="text-[11px] text-[#a6b4ff] font-jetbrains">
                ETA: {trip.eta}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCargoId(trip.cargoId);
                onNavigate('CARGOS');
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-jetbrains font-bold border border-white/20 cursor-pointer"
            >
              CARGO INFO
            </button>
          </div>
        </div>

        {/* Route Progress Visual Card */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#c4c5da] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00a368] animate-pulse" />
              <span className="font-vazirmatn font-bold text-sm text-[#1a1b23]">
                {trText('پیشرفت سفر در آزادراه', 'Freeway Trip Progress', 'Otoyol Sefer İlerlemesi')}
              </span>
            </div>
            <span className="font-jetbrains text-xs font-bold text-[#00258e] bg-[#eeedf9] px-2.5 py-1 rounded">
              {trip.progressPercentage}% COMPLETED
            </span>
          </div>

          <div className="flex items-center justify-between my-6 relative px-4">
            <div className="absolute top-1/2 right-8 left-8 h-1.5 bg-[#e2e1ed] -translate-y-1/2 z-0 rounded-full" />
            <div
              className="absolute top-1/2 right-8 h-1.5 bg-[#00258e] -translate-y-1/2 z-0 rounded-full transition-all duration-500"
              style={{ width: `${trip.progressPercentage}%` }}
            />

            {/* Origin */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div className="w-7 h-7 rounded-full bg-[#00258e] flex items-center justify-center mb-1 shadow-sm">
                <span className="material-symbols-outlined text-white text-[16px]">
                  radio_button_checked
                </span>
              </div>
              <span className="font-vazirmatn text-xs font-bold">{trip.origin}</span>
              <span className="font-jetbrains text-[10px] text-[#545f72]">{trip.departureTime}</span>
            </div>

            {/* Truck Icon */}
            <div
              className="z-10 absolute top-1/2 -translate-y-1/2 translate-x-1/2 bg-white p-1 shadow-md rounded-full border border-[#00258e]"
              style={{ right: `${trip.progressPercentage}%` }}
            >
              <span className="material-symbols-outlined text-[#00258e] text-[22px]">
                local_shipping
              </span>
            </div>

            {/* Destination */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div className="w-7 h-7 rounded-full border-2 border-[#c4c5da] bg-white flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[#747686] text-[16px]">
                  location_on
                </span>
              </div>
              <span className="font-vazirmatn text-xs font-bold">{trip.destination}</span>
              <span className="font-jetbrains text-[10px] text-[#545f72]">ETA {trip.eta}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-[#e2e1ed] pt-4 text-center">
            <div>
              <div className="text-[10px] text-[#545f72] font-jetbrains">{trText('طی شده', 'Covered', 'Katedilen')}</div>
              <div className="font-jetbrains font-bold text-sm mt-0.5" dir="ltr">
                {trip.distanceCoveredKm} km
              </div>
            </div>
            <div className="border-r border-[#e2e1ed]">
              <div className="text-[10px] text-[#545f72] font-jetbrains">{trText('باقیمانده', 'Remaining', 'Kalan')}</div>
              <div className="font-jetbrains font-bold text-sm text-[#00258e] mt-0.5" dir="ltr">
                {trip.distanceRemainingKm} km
              </div>
            </div>
            <div className="border-r border-[#e2e1ed]">
              <div className="text-[10px] text-[#545f72] font-jetbrains">{trText('کل مسافت', 'Total Distance', 'Toplam Mesafe')}</div>
              <div className="font-jetbrains font-bold text-sm mt-0.5" dir="ltr">
                {trip.totalDistanceKm} km
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Sensor Readings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataComponent
            label={trText('سرعت لحظه‌ای ناوگان', 'Live Fleet Speed', 'Anlık Filo Hızı')}
            reading={speedReading}
            icon="speed"
          />
          <DataComponent
            label={trText('مسیر فعال سفر', 'Active Trip Route', 'Aktif Sefer Rotası')}
            reading={routeReading}
            icon="location_on"
          />
          <DataComponent
            label={trText('فاصله باقیمانده تا مقصد', 'Remaining Distance to Destination', 'Hedefe Kalan Mesafe')}
            reading={distanceReading}
            icon="straighten"
          />
          <DataComponent
            label={trText('زمان تخمینی رسیدن (ETA)', 'Estimated Time of Arrival (ETA)', 'Tahmini Varış Zamanı (ETA)')}
            reading={etaReading}
            icon="schedule"
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentScreen="TRIPS" onNavigate={onNavigate} />
    </div>
  );
};
