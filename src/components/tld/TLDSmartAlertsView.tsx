import React, { useState } from 'react';
import { TLDSmartAlert, TLDAlertRuleConfig } from '../../types';
import { tldTrackingService } from '../../services/tldTrackingService';
import { useLanguage } from '../../context/LanguageContext';

interface TLDSmartAlertsViewProps {
  alerts: TLDSmartAlert[];
  rules: TLDAlertRuleConfig;
  onRefresh: () => void;
}

export const TLDSmartAlertsView: React.FC<TLDSmartAlertsViewProps> = ({
  alerts,
  rules,
  onRefresh,
}) => {
  const { trText } = useLanguage();
  const [selectedAlert, setSelectedAlert] = useState<TLDSmartAlert | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<TLDAlertRuleConfig>({ ...rules });
  const [sosStatus, setSosStatus] = useState<string | null>(null);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    tldTrackingService.resolveAlert(selectedAlert.id, actionNote || trText('بررسی شد و وضعیت به حالت عادی بازگشت.', 'Checked and returned to normal.', 'Kontrol edildi ve normale döndü.'));
    setSelectedAlert(null);
    setActionNote('');
    onRefresh();
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    tldTrackingService.updateAlertRules(configForm);
    setShowConfigModal(false);
    onRefresh();
    setSosStatus(trText('تنظیمات آستانه هشدارهای هوشمند با موفقیت به‌روزرسانی شد.', 'Smart alert thresholds updated successfully.', 'Akıllı uyarı eşikleri başarıyla güncellendi.'));
    setTimeout(() => setSosStatus(null), 3000);
  };

  const handleDispatchSos = (serviceName: string) => {
    setSosStatus(trText(`درخواست اضطراری با موفقیت به ${serviceName} به همراه مختصات ماهواره‌ای ارسال گردید.`, `Emergency request successfully sent to ${serviceName} with satellite coordinates.`, `Acil talep, uydu koordinatlarıyla birlikte ${serviceName} birimine başarıyla gönderildi.`));
    setTimeout(() => setSosStatus(null), 4000);
  };

  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Top Incident Summary Bar */}
      <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              unresolvedCount > 0 ? 'bg-[#ba1a1a]/15 text-[#ba1a1a] animate-pulse' : 'bg-[#00a368]/15 text-[#00a368]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {unresolvedCount > 0 ? 'warning' : 'verified_user'}
            </span>
          </div>
          <div>
            <h3 className="font-black text-sm text-[#1a1b23]">
              {trText('مرکز پایش و مدیریت رویدادهای بحرانی (Smart Alerts Engine)', 'Critical Event Monitoring & Management Center (Smart Alerts Engine)', 'Kritik Olay İzleme ve Yönetim Merkezi (Smart Alerts Engine)')}
            </h3>
            <p className="text-xs text-[#545f72] mt-0.5">
              {unresolvedCount > 0
                ? trText(`${unresolvedCount} مورد هشدار فعال نیازمند اقدام فوری اپراتور`, `${unresolvedCount} active alerts require immediate operator action`, `${unresolvedCount} aktif uyarı operatörün acil müdahalesini gerektiriyor`)
                : trText('کلیه پارامترهای ایمنی، دما، وزن و موقعیت در وضعیت نرمال و ایمن می‌باشند.', 'All safety, temperature, weight and location parameters are normal and safe.', 'Tüm güvenlik, sıcaklık, ağırlık ve konum parametreleri normal ve güvenli durumda.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#eeedf9] text-[#00258e] text-xs font-bold hover:bg-[#e2e1ed] transition-all flex items-center gap-1.5 cursor-pointer border border-[#c4c5da]"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>{trText('تنظیم آستانه‌ها و سنسورها', 'Configure thresholds & sensors', 'Eşikleri ve sensörleri ayarla')}</span>
          </button>
        </div>
      </div>

      {/* SOS Quick Emergency Dispatch Bar */}
      <div className="bg-gradient-to-l from-[#ba1a1a]/10 via-[#ba1a1a]/5 to-transparent p-4 rounded-2xl border border-[#ba1a1a]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#ba1a1a]">
          <span className="material-symbols-outlined text-[20px] animate-ping">emergency</span>
          <span>{trText('دکمه‌های اعزام اضطراری و امداد جاده‌ای (Emergency Dispatch SOS):', 'Emergency dispatch & roadside assistance buttons (Emergency Dispatch SOS):', 'Acil sevk ve yol yardımı düğmeleri (Emergency Dispatch SOS):')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDispatchSos(trText('پلیس راهور ۱۱۰', 'Traffic Police 110', 'Trafik Polisi 110'))}
            className="px-3 py-1.5 rounded-lg bg-[#ba1a1a] text-white font-bold hover:bg-[#93000a] transition-all flex items-center gap-1 cursor-pointer shadow-sm text-[11px]"
          >
            <span className="material-symbols-outlined text-[14px]">local_police</span>
            <span>{trText('اعلام به پلیس ۱۱۰', 'Notify Police 110', "Polis 110'a bildir")}</span>
          </button>

          <button
            onClick={() => handleDispatchSos(trText('امداد و نجات هلال احمر ۱۱۲', 'Red Crescent Rescue 112', 'Kızılay Kurtarma 112'))}
            className="px-3 py-1.5 rounded-lg bg-[#ba1a1a] text-white font-bold hover:bg-[#93000a] transition-all flex items-center gap-1 cursor-pointer shadow-sm text-[11px]"
          >
            <span className="material-symbols-outlined text-[14px]">ambulance</span>
            <span>{trText('امداد نجات ۱۱۲', 'Rescue 112', 'Kurtarma 112')}</span>
          </button>

          <button
            onClick={() => handleDispatchSos(trText('امدادخودرو و جرثقیل سنگین', 'Tow Truck & Heavy Crane', 'Çekici ve Ağır Vinç'))}
            className="px-3 py-1.5 rounded-lg bg-[#00258e] text-white font-bold hover:bg-[#0036c5] transition-all flex items-center gap-1 cursor-pointer shadow-sm text-[11px]"
          >
            <span className="material-symbols-outlined text-[14px]">build</span>
            <span>{trText('امداد فنی جاده‌ای', 'Roadside technical assistance', 'Yol teknik yardımı')}</span>
          </button>
        </div>
      </div>

      {sosStatus && (
        <div className="p-3.5 rounded-xl bg-[#00a368]/15 border border-[#00a368] text-[#00a368] text-xs font-bold animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{sosStatus}</span>
        </div>
      )}

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#c4c5da] p-8 text-center text-[#545f72] text-xs space-y-2">
            <span className="material-symbols-outlined text-[36px] text-[#00a368]">check_circle</span>
            <div className="font-bold text-sm text-[#1a1b23]">{trText('هیچ هشداری ثبت نشده است', 'No alerts recorded', 'Kayıtlı uyarı yok')}</div>
            <div>{trText('تمام پارامترهای تله‌متری با استانداردهای تعریف شده همخوانی دارند.', 'All telemetry parameters match the defined standards.', 'Tüm telemetri parametreleri tanımlı standartlarla uyumlu.')}</div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all text-xs space-y-3 ${
                !alert.isResolved
                  ? alert.severity === 'CRITICAL'
                    ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/20 bg-[#ffdad6]/10'
                    : 'border-[#fb8c00] ring-2 ring-[#fb8c00]/20 bg-[#fff3e0]/20'
                  : 'border-[#c4c5da] opacity-85'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e1ed] pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-[#ba1a1a] text-white'
                        : alert.severity === 'WARNING'
                        ? 'bg-[#fb8c00] text-white'
                        : 'bg-[#00258e] text-white'
                    }`}
                  >
                    {alert.severity === 'CRITICAL'
                      ? trText('سطح بحرانی (Critical)', 'Critical level (Critical)', 'Kritik seviye (Critical)')
                      : alert.severity === 'WARNING'
                      ? trText('هشدار احتیاطی (Warning)', 'Warning level (Warning)', 'Uyarı seviyesi (Warning)')
                      : trText('اطلاع‌رسانی (Info)', 'Info (Info)', 'Bilgilendirme (Info)')}
                  </span>
                  <span className="font-bold text-sm text-[#1a1b23]">{trText(alert.title)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#747686] font-jetbrains">{alert.timestamp}</span>
                  {alert.isResolved ? (
                    <span className="bg-[#00a368]/15 text-[#00a368] px-2 py-0.5 rounded font-bold text-[10px]">
                      {trText('✓ برطرف شده', '✓ Resolved', '✓ Giderildi')}
                    </span>
                  ) : (
                    <span className="bg-[#ba1a1a]/15 text-[#ba1a1a] px-2 py-0.5 rounded font-bold text-[10px] animate-pulse">
                      {trText('اقدام فوری لازم است', 'Immediate action required', 'Acil işlem gerekli')}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[#444655] leading-relaxed text-xs">{trText(alert.description)}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#fbf8ff] p-3 rounded-xl border border-[#e2e1ed] text-[11px]">
                <div>
                  <span className="text-[#747686]">{trText('مقدار ثبت شده:', 'Recorded value:', 'Kaydedilen değer:')} </span>
                  <strong className="text-[#ba1a1a] font-jetbrains">{alert.sensorValue}</strong>
                </div>
                <div>
                  <span className="text-[#747686]">{trText('حد آستانه مجاز:', 'Allowed threshold:', 'İzin verilen eşik:')} </span>
                  <strong className="text-[#1a1b23] font-jetbrains">{alert.thresholdValue}</strong>
                </div>
                <div>
                  <span className="text-[#747686]">{trText('موقعیت حادثه:', 'Incident location:', 'Olay konumu:')} </span>
                  <span className="text-[#545f72]">{trText(alert.locationAddress)}</span>
                </div>
              </div>

              {alert.isResolved ? (
                <div className="p-2.5 rounded-lg bg-[#eeedf9] text-[11px] text-[#545f72] flex items-center justify-between">
                  <span>{trText('اقدام ثبت شده:', 'Action taken:', 'Kaydedilen işlem:')} <strong>{trText(alert.actionTaken ?? '')}</strong></span>
                  <span className="font-jetbrains text-[10px]">{trText('زمان رفع:', 'Resolved at:', 'Giderilme zamanı:')} {alert.resolvedAt}</span>
                </div>
              ) : (
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="px-4 py-2 rounded-xl bg-[#00258e] text-white font-bold hover:bg-[#0036c5] transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">done_all</span>
                    <span>{trText('ثبت اقدام اصلاحی و رفع هشدار', 'Record corrective action & resolve alert', 'Düzeltici işlemi kaydet ve uyarıyı gider')}</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolve Action Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#c4c5da] shadow-2xl space-y-4 font-vazirmatn text-[#1a1b23]">
            <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
              <h3 className="font-black text-base text-[#1a1b23]">{trText('ثبت اقدام و بستن هشدار', 'Record Action & Close Alert', 'İşlem Kaydet ve Uyarıyı Kapat')}</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#ffdad6]/20 border border-[#ba1a1a]/30 text-xs">
              <strong className="text-[#ba1a1a] block">{trText(selectedAlert.title)}</strong>
              <span className="text-[#545f72]">{trText(selectedAlert.description)}</span>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#1a1b23] block mb-1">
                  {trText('گزارش اقدام اصلاحی انجام شده:', 'Corrective action report:', 'Yapılan düzeltici işlem raporu:')}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={trText('مثال: تماس با راننده برقرار شد و دور یونیت سرمایشی به حداکثر تغییر یافت...', 'e.g. Contacted the driver and set the cooling unit to maximum...', 'Örnek: Sürücüyle iletişime geçildi ve soğutma ünitesi maksimuma alındı...')}
                  className="w-full p-3 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] text-xs focus:outline-none focus:border-[#00258e]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#c4c5da] text-[#545f72] text-xs font-bold hover:bg-[#eeedf9] cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'İptal')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00a368] text-white text-xs font-bold hover:bg-[#008f5a] cursor-pointer shadow-sm"
                >
                  {trText('تایید و رفع هشدار', 'Confirm & Resolve Alert', 'Onayla ve Uyarıyı Gider')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threshold Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#c4c5da] shadow-2xl space-y-4 font-vazirmatn text-[#1a1b23] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2e1ed] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00258e]/10 text-[#00258e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </div>
                <h3 className="font-black text-base text-[#1a1b23]">{trText('تنظیم آستانه‌های سنسور TLD Box', 'TLD Box Sensor Threshold Settings', 'TLD Box Sensör Eşik Ayarları')}</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#747686] hover:text-[#1a1b23] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1a1b23] block mb-1">{trText('حداقل دمای مجاز (°C):', 'Min allowed temperature (°C):', 'İzin verilen min sıcaklık (°C):')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={configForm.tempMinCelsius}
                    onChange={(e) => setConfigForm({ ...configForm, tempMinCelsius: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] font-jetbrains text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1a1b23] block mb-1">{trText('حداکثر دمای مجاز (°C):', 'Max allowed temperature (°C):', 'İzin verilen maks sıcaklık (°C):')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={configForm.tempMaxCelsius}
                    onChange={(e) => setConfigForm({ ...configForm, tempMaxCelsius: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] font-jetbrains text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1a1b23] block mb-1">{trText('سقف سرعت مجاز (km/h):', 'Max allowed speed (km/h):', 'İzin verilen maks hız (km/h):')}</label>
                  <input
                    type="number"
                    value={configForm.maxSpeedKmH}
                    onChange={(e) => setConfigForm({ ...configForm, maxSpeedKmH: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] font-jetbrains text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1a1b23] block mb-1">{trText('تلرانس افت وزن (کیلوگرم):', 'Weight loss tolerance (kg):', 'Ağırlık kaybı toleransı (kg):')}</label>
                  <input
                    type="number"
                    value={configForm.weightLossToleranceKg}
                    onChange={(e) => setConfigForm({ ...configForm, weightLossToleranceKg: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] font-jetbrains text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1a1b23] block mb-1">{trText('شعاع انحراف ژئوفنس (متر):', 'Geofence deviation radius (m):', 'Jeofence sapma yarıçapı (m):')}</label>
                  <input
                    type="number"
                    value={configForm.geofenceToleranceMeters}
                    onChange={(e) => setConfigForm({ ...configForm, geofenceToleranceMeters: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] font-jetbrains text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1a1b23] block mb-1">{trText('حد ضربه و شتاب (G):', 'Shock & acceleration limit (G):', 'Darbe ve ivme sınırı (G):')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={configForm.shockImpactThresholdG}
                    onChange={(e) => setConfigForm({ ...configForm, shockImpactThresholdG: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#c4c5da] bg-[#fbf8ff] font-jetbrains text-center"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#e2e1ed] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.smsAlertsEnabled}
                    onChange={(e) => setConfigForm({ ...configForm, smsAlertsEnabled: e.target.checked })}
                    className="rounded text-[#00258e] focus:ring-0"
                  />
                  <span>{trText('ارسال پیامک آنی (SMS) به شماره مدیر ترابری هنگام رخداد بحرانی', 'Send instant SMS to the transport manager on critical events', 'Kritik olaylarda ulaşım yöneticisine anlık SMS gönder')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.emergencySosEnabled}
                    onChange={(e) => setConfigForm({ ...configForm, emergencySosEnabled: e.target.checked })}
                    className="rounded text-[#00258e] focus:ring-0"
                  />
                  <span>{trText('فعال‌سازی ماژول خودکار اعزام امداد در صورت تصادف شدید بالای ۳G', 'Enable automatic rescue dispatch on severe crashes above 3G', '3G üzeri şiddetli kazalarda otomatik yardım sevkini etkinleştir')}</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#c4c5da] text-[#545f72] font-bold hover:bg-[#eeedf9] cursor-pointer"
                >
                  {trText('انصراف', 'Cancel', 'İptal')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00258e] text-white font-bold hover:bg-[#0036c5] cursor-pointer shadow-sm"
                >
                  {trText('ذخیره تنظیمات', 'Save Settings', 'Ayarları Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
