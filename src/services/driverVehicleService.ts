import { RegisteredVehicle } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { mockDriverVehicles } from './mockDataProvider';

class DriverVehicleService {
  private localVehicles: RegisteredVehicle[] = [...mockDriverVehicles];

  async fetchVehicles(driverId?: string): Promise<RegisteredVehicle[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('driver_vehicles')
            .select('*')
            .order('is_primary', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map((v) => ({
              id: v.id,
              driverId: v.driver_id || 'DRV-1001',
              truckType: v.truck_type,
              brand: v.brand,
              model: v.model,
              buildYear: v.build_year || '1400',
              color: v.color || 'سفید روغنی',
              plateNumber: v.plate_number,
              platePart1: v.plate_part1 || '۱۲',
              plateLetter: v.plate_letter || 'ع',
              platePart2: v.plate_part2 || '۳۴۵',
              plateIranCode: v.plate_iran_code || '۶۸',
              chassisNumber: v.chassis_number,
              engineNumber: v.engine_number,
              smartCardTruck: v.smart_card_truck,
              capacityTons: Number(v.capacity_tons) || 22,
              volumeM3: Number(v.volume_m3) || 85,
              axles: v.axles || 5,
              isPrimary: Boolean(v.is_primary),
              isActive: Boolean(v.is_active),
              smartBoxId: v.smart_box_id || 'TLD-BOX-9941',
              smartLockStatus: v.smart_lock_status || 'LOCKED',
              currentSpeedKmH: Number(v.current_speed_kmh) || 0,
              cargoTemperature: Number(v.cargo_temperature) || 4.2,
              ambientHumidity: Number(v.ambient_humidity) || 38,
              batteryHealthPercent: Number(v.battery_health_percentage) || 96,
              fuelLevelPercent: Number(v.fuel_level_percentage) || 78,
              tirePressureBar: Number(v.tire_pressure_bar) || 8.8,
              lastSyncTime: 'همین الان',
            }));
          }
        }
      } catch (err) {
        console.warn('Fallback to local driver vehicles:', err);
      }
    }
    return [...this.localVehicles];
  }

  async addVehicle(vehicleData: Omit<RegisteredVehicle, 'id' | 'lastSyncTime'>): Promise<RegisteredVehicle> {
    const newVehicle: RegisteredVehicle = {
      ...vehicleData,
      id: `VEH-${Date.now().toString().slice(-6)}`,
      lastSyncTime: 'چند لحظه پیش',
    };

    if (newVehicle.isPrimary) {
      this.localVehicles = this.localVehicles.map((v) => ({ ...v, isPrimary: false }));
    }
    this.localVehicles.unshift(newVehicle);

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.from('driver_vehicles').insert({
            truck_type: newVehicle.truckType,
            brand: newVehicle.brand,
            model: newVehicle.model,
            build_year: newVehicle.buildYear,
            color: newVehicle.color,
            plate_number: newVehicle.plateNumber,
            plate_part1: newVehicle.platePart1,
            plate_letter: newVehicle.plateLetter,
            plate_part2: newVehicle.platePart2,
            plate_iran_code: newVehicle.plateIranCode,
            chassis_number: newVehicle.chassisNumber,
            engine_number: newVehicle.engineNumber,
            smart_card_truck: newVehicle.smartCardTruck,
            capacity_tons: newVehicle.capacityTons,
            volume_m3: newVehicle.volumeM3,
            axles: newVehicle.axles,
            is_primary: newVehicle.isPrimary,
            smart_box_id: newVehicle.smartBoxId,
            smart_lock_status: newVehicle.smartLockStatus,
          });
        }
      } catch (err) {
        console.error('Error inserting vehicle in Supabase:', err);
      }
    }

    return newVehicle;
  }

  async setPrimaryVehicle(vehicleId: string): Promise<void> {
    this.localVehicles = this.localVehicles.map((v) => ({
      ...v,
      isPrimary: v.id === vehicleId,
    }));

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.from('driver_vehicles').update({ is_primary: false }).neq('id', vehicleId);
          await client.from('driver_vehicles').update({ is_primary: true }).eq('id', vehicleId);
        }
      } catch (err) {
        console.error('Error setting primary vehicle in Supabase:', err);
      }
    }
  }

  async toggleSmartLock(vehicleId: string): Promise<'LOCKED' | 'UNLOCKED'> {
    const target = this.localVehicles.find((v) => v.id === vehicleId);
    const newStatus = target && target.smartLockStatus === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';

    this.localVehicles = this.localVehicles.map((v) =>
      v.id === vehicleId ? { ...v, smartLockStatus: newStatus } : v
    );

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.from('driver_vehicles').update({ smart_lock_status: newStatus }).eq('id', vehicleId);
        }
      } catch (err) {
        console.error('Error toggling smart lock in Supabase:', err);
      }
    }

    return newStatus;
  }
}

export const driverVehicleService = new DriverVehicleService();
