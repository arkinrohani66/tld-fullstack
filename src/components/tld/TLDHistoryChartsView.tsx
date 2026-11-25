import React, { useState } from 'react';
import { TLDTelemetryHistoricalPoint } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface TLDHistoryChartsViewProps {
  historyData: TLDTelemetryHistoricalPoint[];
}

export const TLDHistoryChartsView: React.FC<TLDHistoryChartsViewProps> = ({ historyData }) => {
  const { trText } = useLanguage();
  const [activeMetric, setActiveMetric] = useState<'TEMP' | 'WEIGHT' | 'SPEED' | 'SHOCK'>('TEMP');
  const [timeRange, setTimeRange] = useState<'1H' | '6H' | '12H' | 'ALL'>('ALL');

  const handleExportCsv = () => {
    const headers = 'ID,Timestamp,Location,Speed(km/h),TempZone1(C),TempZone2(C),TempZone3(C),Weight(Tons),Shock(G)\n';
    const rows = historyData
      .map(
        (p) =>
          `${p.id},${p.timestamp},"${p.locationName}",${p.speedKmH},${p.tempZone1},${p.tempZone2},${p.tempZone3},${p.weightTons},${p.shockG}`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TLD_Telemetry_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = 40;

  // Calculate points for active metric
  const pointsCount = historyData.length;
  const getCoordinates = (index: number, value: number, minVal: number, maxVal: number) => {
    const x = padding + (index / (pointsCount - 1 || 1)) * (chartWidth - 2 * padding);
    const normalizedY = (value - minVal) / (maxVal - minVal || 1);
    const y = chartHeight - padding - normalizedY * (chartHeight - 2 * padding);
    return { x, y };
  };

  // Metric specifics
  let minVal = 0;
  let maxVal = 100;
  let unit = '';
  let color = '#00258e';

  if (activeMetric === 'TEMP') {
    minVal = -24;
    maxVal = -10;
    unit = '°C';
    color = '#0288d1';
  } else if (activeMetric === 'WEIGHT') {
    minVal = 15;
    maxVal = 26;
    unit = trText('تن', 't', 'ton');
    color = '#00258e';
  } else if (activeMetric === 'SPEED') {
    minVal = 0;
    maxVal = 110;
    unit = 'km/h';
    color = '#00a368';
  } else if (activeMetric === 'SHOCK') {
    minVal = 0;
    maxVal = 4;
    unit = 'G';
    color = '#ba1a1a';
  }

  const svgPoints = historyData.map((p, idx) => {
    let val = 0;
    if (activeMetric === 'TEMP') val = p.tempZone2;
    else if (activeMetric === 'WEIGHT') val = p.weightTons;
    else if (activeMetric === 'SPEED') val = p.speedKmH;
    else if (activeMetric === 'SHOCK') val = p.shockG;

    return getCoordinates(idx, val, minVal, maxVal);
  });

  const polylineStr = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Chart Controls Bar */}
      <div className="bg-white rounded-2xl border border-[#c4c5da] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveMetric('TEMP')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'TEMP'
                ? 'bg-[#0288d1] text-white shadow-sm'
                : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#e2e1ed]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">ac_unit</span>
            <span>{trText('نمودار دما (°C)', 'Temperature chart (°C)', 'Sıcaklık grafiği (°C)')}</span>
          </button>

          <button
            onClick={() => setActiveMetric('WEIGHT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'WEIGHT'
                ? 'bg-[#00258e] text-white shadow-sm'
                : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#e2e1ed]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">scale</span>
            <span>{trText('نمودار وزن و تناژ (Tons)', 'Weight & tonnage chart (Tons)', 'Ağırlık ve tonaj grafiği (Ton)')}</span>
          </button>

          <button
            onClick={() => setActiveMetric('SPEED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'SPEED'
                ? 'bg-[#00a368] text-white shadow-sm'
                : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#e2e1ed]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">speed</span>
            <span>{trText('نمودار سرعت (km/h)', 'Speed chart (km/h)', 'Hız grafiği (km/h)')}</span>
          </button>

          <button
            onClick={() => setActiveMetric('SHOCK')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMetric === 'SHOCK'
                ? 'bg-[#ba1a1a] text-white shadow-sm'
                : 'bg-[#fbf8ff] text-[#545f72] hover:bg-[#eeedf9] border border-[#e2e1ed]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">vibration</span>
            <span>{trText('ضربه و لرزش (G-Force)', 'Shock & vibration (G-Force)', 'Darbe ve titreşim (G-Force)')}</span>
          </button>
        </div>

        {/* Time Range & Export */}
        <div className="flex items-center gap-2">
          <div className="bg-[#eeedf9] p-1 rounded-xl flex items-center text-xs font-bold font-jetbrains">
            {(['1H', '6H', '12H', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === r ? 'bg-white text-[#00258e] shadow-xs' : 'text-[#747686] hover:text-[#1a1b23]'
                }`}
              >
                {r === 'ALL' ? trText('کل مسیر', 'Whole route', 'Tüm güzergâh') : r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-[#eeedf9] text-[#00258e] text-xs font-bold hover:bg-[#e2e1ed] transition-all flex items-center gap-1 cursor-pointer border border-[#c4c5da]"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>{trText('خروجی CSV', 'CSV Export', 'CSV Çıktısı')}</span>
          </button>
        </div>
      </div>

      {/* Main Time-Series Visual Graph Card */}
      <div className="bg-white rounded-2xl border border-[#c4c5da] p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-[#e2e1ed] pb-3">
          <div>
            <h3 className="font-black text-sm text-[#1a1b23]">
              {activeMetric === 'TEMP' && trText('روند تغییرات دمای محفظه بار در طول مسیر سفر', 'Cargo compartment temperature trend along the trip', 'Yolculuk boyunca kargo bölmesi sıcaklık eğilimi')}
              {activeMetric === 'WEIGHT' && trText('پایداری و مانیتورینگ وزن محموله روی لودسل‌های تریلر', 'Cargo weight stability & monitoring on trailer load cells', 'Treyler yük hücrelerinde kargo ağırlığı kararlılığı ve izleme')}
              {activeMetric === 'SPEED' && trText('پروفایل سرعت و دینامیک حرکت راننده در جاده', 'Speed profile & driver motion dynamics on the road', 'Yolda hız profili ve sürücü hareket dinamiği')}
              {activeMetric === 'SHOCK' && trText('ثبت شوک‌های حرکتی، دست‌انداز و شتاب جانبی ۳ محوره', 'Records motion shocks, road bumps and 3-axis lateral acceleration', 'Hareket şoklarını, yol tümseklerini ve 3 eksenli yanal ivmeyi kaydeder')}
            </h3>
            <span className="text-xs text-[#545f72]">{trText('فاصله نمونه‌برداری سنسورها: هر ۳۰ ثانیه • تطابق با استاندارد RMTO', 'Sensor sampling interval: every 30 seconds • Compliant with RMTO standard', 'Sensör örnekleme aralığı: her 30 saniye • RMTO standardına uygun')}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-jetbrains">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-bold text-[#1a1b23]">{trText(`داده سنسور (${unit})`, `Sensor data (${unit})`, `Sensör verisi (${unit})`)}</span>
          </div>
        </div>

        {/* SVG Time Series Render Canvas */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px]">
            <svg className="w-full h-64 select-none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + ratio * (chartHeight - 2 * padding);
                const labelVal = (maxVal - ratio * (maxVal - minVal)).toFixed(1);
                return (
                  <g key={idx}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="#eeedf9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding - 8}
                      y={y + 4}
                      fill="#747686"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {labelVal} {unit}
                    </text>
                  </g>
                );
              })}

              {/* Threshold Bounds reference lines for Temperature */}
              {activeMetric === 'TEMP' && (
                <>
                  <line
                    x1={padding}
                    y1={getCoordinates(0, -15, minVal, maxVal).y}
                    x2={chartWidth - padding}
                    y2={getCoordinates(0, -15, minVal, maxVal).y}
                    stroke="#ba1a1a"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                  />
                  <text
                    x={chartWidth - padding}
                    y={getCoordinates(0, -15, minVal, maxVal).y - 4}
                    fill="#ba1a1a"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {trText('حداکثر مجاز (-15°C)', 'Max allowed (-15°C)', 'İzin verilen maksimum (-15°C)')}
                  </text>
                </>
              )}

              {/* Polyline Data Series */}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />

              {/* Data Point Circles */}
              {historyData.map((p, idx) => {
                const coord = svgPoints[idx];
                let val = 0;
                if (activeMetric === 'TEMP') val = p.tempZone2;
                else if (activeMetric === 'WEIGHT') val = p.weightTons;
                else if (activeMetric === 'SPEED') val = p.speedKmH;
                else if (activeMetric === 'SHOCK') val = p.shockG;

                return (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="5"
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth="2.5"
                      className="transition-all group-hover:r-7"
                    />
                    {/* Tooltip on hover */}
                    <text
                      x={coord.x}
                      y={coord.y - 10}
                      fill="#1a1b23"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {val}
                    </text>
                    {/* X-axis time label */}
                    <text
                      x={coord.x}
                      y={chartHeight - 12}
                      fill="#545f72"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="Vazirmatn, sans-serif"
                    >
                      {p.timestamp}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Historical Data Log Table */}
      <div className="bg-white rounded-2xl border border-[#c4c5da] p-5 shadow-sm space-y-4">
        <h3 className="font-black text-sm text-[#1a1b23] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00258e]">table_chart</span>
          <span>{trText('لاگ جدول سوابق تله‌متری و بازرسی ایستگاه‌ها (Sensor Audit Log)', 'Telemetry Records & Station Inspection Log (Sensor Audit Log)', 'Telemetri Kayıtları ve İstasyon Denetim Günlüğü (Sensor Audit Log)')}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#fbf8ff] text-[#545f72] border-b border-[#e2e1ed] font-bold">
                <th className="p-3">{trText('زمان ثبت', 'Logged Time', 'Kayıt Zamanı')}</th>
                <th className="p-3">{trText('ایستگاه و موقعیت GPS', 'Station & GPS Position', 'İstasyon ve GPS Konumu')}</th>
                <th className="p-3 text-center">{trText('سرعت (km/h)', 'Speed (km/h)', 'Hız (km/h)')}</th>
                <th className="p-3 text-center">{trText('دما Z1 / Z2 / Z3 (°C)', 'Temp Z1 / Z2 / Z3 (°C)', 'Sıcaklık Z1 / Z2 / Z3 (°C)')}</th>
                <th className="p-3 text-center">{trText('وزن بار (تن)', 'Cargo Weight (t)', 'Kargo Ağırlığı (ton)')}</th>
                <th className="p-3 text-center">{trText('شوک (G)', 'Shock (G)', 'Şok (G)')}</th>
                <th className="p-3 text-center">{trText('باتری IoT', 'IoT Battery', 'IoT Bataryası')}</th>
                <th className="p-3 text-center">{trText('وضعیت رخداد', 'Event Status', 'Olay Durumu')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e1ed] font-jetbrains">
              {historyData.map((item) => (
                <tr key={item.id} className="hover:bg-[#fbf8ff] transition-colors">
                  <td className="p-3 font-bold text-[#1a1b23]">{item.timestamp}</td>
                  <td className="p-3 font-vazirmatn text-[#545f72]">{trText(item.locationName)}</td>
                  <td className="p-3 text-center text-[#1a1b23] font-bold">{item.speedKmH}</td>
                  <td className="p-3 text-center text-[#0288d1] font-bold">
                    {item.tempZone1} / {item.tempZone2} / {item.tempZone3}
                  </td>
                  <td className="p-3 text-center text-[#00258e] font-bold">{item.weightTons}</td>
                  <td className="p-3 text-center text-[#545f72]">{item.shockG} G</td>
                  <td className="p-3 text-center text-[#00a368] font-bold">%{item.batteryPct}</td>
                  <td className="p-3 text-center font-vazirmatn">
                    <span className="bg-[#00a368]/15 text-[#00a368] text-[10px] font-bold px-2 py-0.5 rounded">
                      {trText('تأیید استاندارد', 'Standard verified', 'Standart onaylı')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
