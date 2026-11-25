import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogistics } from '../context/LogisticsContext';
import { AppScreen } from '../types';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { tldTrackingService } from '../services/tldTrackingService';
import { shipperService } from '../services/shipperService';

// Subcomponents
import { TLDMapGpsView } from '../components/tld/TLDMapGpsView';
import { TLDSensorMatrixView } from '../components/tld/TLDSensorMatrixView';
import { TLDBoxHardwareView } from '../components/tld/TLDBoxHardwareView';
import { TLDHistoryChartsView } from '../components/tld/TLDHistoryChartsView';
import { TLDSmartAlertsView } from '../components/tld/TLDSmartAlertsView';

interface ShipperTrackingScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export const ShipperTrackingScreen: React.FC<ShipperTrackingScreenProps> = ({ onNavigate }) => {
  const { dir, trText } = useLanguage();
  const { openChatForEntity } = useLogistics();

  const [activeTab, setActiveTab] = useState<'GPS_MAP' | 'SENSORS' | 'TLD_BOX' | 'HISTORY' | 'ALERTS'>('GPS_MAP');

  // Bindings from TLD Service
  const [boxInfo, setBoxInfo] = useState(tldTrackingService.getBoxInfo());
  const [sensorMetrics, setSensorMetrics] = useState(tldTrackingService.getSensorMetrics());
  const [historyData, setHistoryData] = useState(tldTrackingService.getHistoricalData());
  const [alerts, setAlerts] = useState(tldTrackingService.getAlerts());
  const [alertRules, setAlertRules] = useState(tldTrackingService.getAlertRules());

  const refreshState = () => {
    setBoxInfo({ ...tldTrackingService.getBoxInfo() });
    setSensorMetrics({ ...tldTrackingService.getSensorMetrics() });
    setHistoryData([...tldTrackingService.getHistoricalData()]);
    setAlerts([...tldTrackingService.getAlerts()]);
    setAlertRules({ ...tldTrackingService.getAlertRules() });
  };

  useEffect(() => {
    const unsubscribe = tldTrackingService.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, []);

  const cargo = shipperService.getCargos()[0];
  const unresolvedAlertsCount = alerts.filter((a) => !a.isResolved).length;

  const handleContactDriver = () => {
    if (cargo?.assignedDriver) {
      openChatForEntity(cargo.assignedDriver.fullName, trText(`راننده محموله ${cargo.cargoNumber}`, `Cargo driver ${cargo.cargoNumber}`, `Yük sürücüsü ${cargo.cargoNumber}`));
      onNavigate('CHAT');
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b23] min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 font-vazirmatn" dir={dir}>
      <AppHeader currentScreen="SHIPPER_TRACKING" onNavigate={onNavigate} />
      <DesktopSidebar currentScreen="SHIPPER_TRACKING" onNavigate={onNavigate} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00a368] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a368] animate-ping" />
              <span>{trText('مرکز رهگیری ماهواره‌ای و تله‌متری هوشمند TLD Box', 'Smart Satellite Tracking & Telemetry Center — TLD Box', 'Akıllı Uydu Takip ve Telemetri Merkezi — TLD Box')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a1b23] mt-1">
              {trText('پایش بلادرنگ سنسورها و موقعیت ناوگان', 'Real-time Monitoring of Sensors and Fleet Location', 'Sensörlerin ve Filo Konumunun Gerçek Zamanlı İzlenmesi')}
            </h1>
            <p className="text-xs text-[#545f72] mt-0.5">
              {trText('محموله:', 'Cargo:', 'Yük:')}{' '}
              {cargo ? (
                <>
                  <strong className="text-[#1a1b23]">{cargo.cargoInfo.title}</strong> ({cargo.cargoNumber})
                </>
              ) : (
                <strong className="text-[#747686]">{trText('محموله‌ای انتخاب نشده', 'No cargo selected', 'Yük seçilmedi')}</strong>
              )}{' '}
              • {trText('دستگاه IoT:', 'IoT device:', 'IoT cihazı:')} <strong className="font-jetbrains text-[#00258e]">{boxInfo.boxSerialNumber}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleContactDriver}
              className="px-4 py-2.5 rounded-xl bg-[#00258e] text-white text-xs font-bold hover:bg-[#0036c5] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>{trText('تماس با راننده', 'Call Driver', 'Sürücüyü Ara')}</span>
            </button>
            <button
              onClick={() => onNavigate('SHIPPER_DELIVERY_CONFIRM')}
              className="px-4 py-2.5 rounded-xl bg-[#00a368] text-white text-xs font-black hover:bg-[#008f5a] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>{trText('تأیید تحویل (POD)', 'Confirm Delivery (POD)', 'Teslimatı Onayla (POD)')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#c4c5da] gap-2 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setActiveTab('GPS_MAP')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'GPS_MAP'
                ? 'border-[#00258e] text-[#00258e]'
                : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            <span>{trText('مرکز Tracking و نمایش GPS', 'Tracking & GPS Map', 'Takip ve GPS Haritası')}</span>
          </button>

          <button
            onClick={() => setActiveTab('SENSORS')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'SENSORS'
                ? 'border-[#00258e] text-[#00258e]'
                : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">sensors</span>
            <span>{trText('وضعیت سنسورها (دما، وزن، سرعت، ETA)', 'Sensor Status (temperature, weight, speed, ETA)', 'Sensör Durumu (sıcaklık, ağırlık, hız, ETA)')}</span>
          </button>

          <button
            onClick={() => setActiveTab('TLD_BOX')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'TLD_BOX'
                ? 'border-[#00258e] text-[#00258e]'
                : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">developer_board</span>
            <span>{trText('مشخصات سخت‌افزار TLD Box و پلمپ', 'TLD Box Hardware & Seal Details', 'TLD Box Donanımı ve Mühür Bilgileri')}</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'HISTORY'
                ? 'border-[#00258e] text-[#00258e]'
                : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">show_chart</span>
            <span>{trText('تاریخچه داده‌های سنسورها', 'Sensor Data History', 'Sensör Verisi Geçmişi')}</span>
          </button>

          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 relative ${
              activeTab === 'ALERTS'
                ? 'border-[#ba1a1a] text-[#ba1a1a]'
                : 'border-transparent text-[#545f72] hover:text-[#1a1b23]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">notification_important</span>
            <span>{trText('هشدارهای هوشمند و رویدادها', 'Smart Alerts & Events', 'Akıllı Uyarılar ve Olaylar')}</span>
            {unresolvedAlertsCount > 0 && (
              <span className="bg-[#ba1a1a] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {unresolvedAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Views */}
        <div className="transition-all duration-200">
          {activeTab === 'GPS_MAP' && (
            <div className="space-y-6">
              <TLDMapGpsView metrics={sensorMetrics} />
            </div>
          )}

          {activeTab === 'SENSORS' && (
            <div className="space-y-6">
              <TLDSensorMatrixView metrics={sensorMetrics} />
            </div>
          )}

          {activeTab === 'TLD_BOX' && (
            <div className="space-y-6">
              <TLDBoxHardwareView
                boxInfo={boxInfo}
                metrics={sensorMetrics}
                onRefresh={refreshState}
              />
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-6">
              <TLDHistoryChartsView historyData={historyData} />
            </div>
          )}

          {activeTab === 'ALERTS' && (
            <div className="space-y-6">
              <TLDSmartAlertsView
                alerts={alerts}
                rules={alertRules}
                onRefresh={refreshState}
              />
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav currentScreen="TRIPS" onNavigate={onNavigate} />
    </div>
  );
};
