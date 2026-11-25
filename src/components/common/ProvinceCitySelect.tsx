import React, { useMemo } from 'react';
import { IRAN_PROVINCES, getCitiesForProvince } from '../../data/iranLocations';
import { useLanguage } from '../../context/LanguageContext';

interface ProvinceCitySelectProps {
  selectedProvince: string;
  selectedCity: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  provinceLabel?: string;
  cityLabel?: string;
  containerClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
}

export const ProvinceCitySelect: React.FC<ProvinceCitySelectProps> = ({
  selectedProvince,
  selectedCity,
  onProvinceChange,
  onCityChange,
  provinceLabel = 'استان محل سکونت',
  cityLabel = 'شهر محل سکونت',
  containerClassName = 'grid grid-cols-1 md:grid-cols-2 gap-4',
  selectClassName = 'w-full bg-[#fbf8ff] border border-[#c4c5da] rounded-xl p-3 pl-10 text-sm font-vazirmatn text-[#1a1b23] appearance-none focus:border-[#00258e] focus:ring-1 focus:ring-[#00258e] outline-none cursor-pointer',
  disabled = false,
}) => {
  const { trText } = useLanguage();

  // Get cities of the current province
  const availableCities = useMemo(() => {
    return getCitiesForProvince(selectedProvince);
  }, [selectedProvince]);

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value;
    onProvinceChange(newProvince);

    // Auto-update city to the first city of the newly selected province
    const newCities = getCitiesForProvince(newProvince);
    if (newCities.length > 0 && !newCities.includes(selectedCity)) {
      onCityChange(newCities[0]);
    }
  };

  return (
    <div className={containerClassName}>
      {/* Province Selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-semibold text-[#444655] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00258e]">map</span>
            <span>{provinceLabel === 'استان محل سکونت' ? trText('استان محل سکونت', 'Province of residence', 'İkamet edilen il') : trText(provinceLabel)}</span>
          </label>
          <span className="font-jetbrains text-[10px] text-[#747686] bg-[#eeedf9] px-2 py-0.5 rounded-full">
            {trText('۳۱ استان', '31 provinces', '31 il')}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedProvince}
            onChange={handleProvinceSelect}
            disabled={disabled}
            className={selectClassName}
          >
            {IRAN_PROVINCES.map((prov) => (
              <option key={prov.id} value={prov.name}>
                {trText(`${prov.name} (${prov.cities.length} شهر)`, `${prov.name} (${prov.cities.length} cities)`, `${prov.name} (${prov.cities.length} şehir)`)}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none text-[20px]">
            arrow_drop_down
          </span>
        </div>
      </div>

      {/* City Selector (Filtered strictly by selected province) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs md:text-sm font-semibold text-[#444655] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00258e]">location_city</span>
            <span>{cityLabel === 'شهر محل سکونت' ? trText('شهر محل سکونت', 'City of residence', 'İkamet edilen şehir') : trText(cityLabel)}</span>
          </label>
          <span className="font-jetbrains text-[10px] text-[#00258e] font-bold bg-[#eeedf9] px-2 py-0.5 rounded-full">
            {trText(`${availableCities.length} شهر موجود`, `${availableCities.length} cities available`, `${availableCities.length} şehir mevcut`)}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={disabled}
            className={selectClassName}
          >
            {availableCities.map((cityName, idx) => (
              <option key={`${cityName}-${idx}`} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none text-[20px]">
            arrow_drop_down
          </span>
        </div>
      </div>
    </div>
  );
};
