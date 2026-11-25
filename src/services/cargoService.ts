import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { CargoItem, UserRole } from '../types';
import { mockCargos } from './mockDataProvider';

const mapDbCargo = (item: any): CargoItem => ({
  id: item.id,
  title: item.title || `محموله ${item.id}`,
  origin: item.origin_city || 'مبدا',
  destination: item.destination_city || 'مقصد',
  status: item.status || 'PENDING_DRIVER',
  eta: 'در انتظار',
  weight: item.weight_tons ? `${Number(item.weight_tons).toLocaleString('fa-IR')} تن` : 'نامشخص',
  truckType: item.truck_type || 'تریلی کفی',
  price: item.agreed_fare_tomans
    ? `${Number(item.agreed_fare_tomans).toLocaleString('fa-IR')} تومان`
    : 'توافقی',
  agreedFareTomans: item.agreed_fare_tomans ? Number(item.agreed_fare_tomans) : undefined,
  assignedDriverId: item.assigned_driver_id || undefined,
  weightTons: item.weight_tons ? Number(item.weight_tons) : undefined,
  progressPercentage: 0,
});

export const cargoService = {
  async fetchCargos(role?: UserRole, userId?: string): Promise<CargoItem[]> {
    if (!isSupabaseConfigured()) {
      return mockCargos;
    }

    const client = getSupabaseClient();
    if (!client) return [];

    try {
      let query = client.from('cargos').select('*').order('created_at', { ascending: false });

      if (role === 'SHIPPER' && userId) {
        query = query.eq('shipper_id', userId);
      } else if (role === 'DRIVER' && userId) {
        query = query.or(`assigned_driver_id.eq.${userId},status.eq.PENDING_DRIVER`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('fetchCargos query error:', error.message);
        return mockCargos;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(mapDbCargo);
    } catch (err) {
      console.error('Error in cargoService.fetchCargos:', err);
      return [];
    }
  },

  async fetchCargoById(id: string): Promise<CargoItem | null> {
    if (!isSupabaseConfigured()) {
      const found = mockCargos.find((c) => c.id === id);
      return found || null;
    }

    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client.from('cargos').select('*').eq('id', id).single();
      if (error || !data) {
        return null;
      }
      return mapDbCargo(data);
    } catch (err) {
      console.error('Error in cargoService.fetchCargoById:', err);
      return null;
    }
  },

  async saveShipperCargo(cargo: {
    id: string;
    title: string;
    originCity: string;
    destinationCity: string;
    weightTons: number;
    truckType: string;
  }): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client.from('cargos').insert({
      id: cargo.id,
      title: cargo.title,
      origin_city: cargo.originCity,
      destination_city: cargo.destinationCity,
      weight_tons: cargo.weightTons,
      truck_type: cargo.truckType,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Inserts a cargo using only the columns granted to the client and returns the real DB id.
   * Throws on failure so callers can surface honest errors.
   */
  async addCargo(
    cargo: { title: string; origin: string; destination: string; weight?: string; truckType?: string },
    shipperId?: string
  ): Promise<string> {
    const client = getSupabaseClient();
    if (!client) {
      return `CRG-${Math.floor(1000 + Math.random() * 9000)}-TH`;
    }

    const weightTons = cargo.weight
      ? parseFloat(cargo.weight.replace(/[^\d.]/g, '')) || null
      : null;

    // `cargos.id` is a text primary key WITHOUT a database default, and the insert
    // grant includes `id`, so the client must supply it explicitly. Without this the
    // insert always fails with a not-null violation and "ثبت بار" never works.
    const newCargoId = `CRG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const dbPayload: Record<string, unknown> = {
      id: newCargoId,
      title: cargo.title,
      origin_city: cargo.origin,
      destination_city: cargo.destination,
      weight_tons: weightTons,
      truck_type: cargo.truckType || 'تریلی کفی',
    };
    if (shipperId) {
      dbPayload.shipper_id = shipperId;
    }

    const { data, error } = await client.from('cargos').insert([dbPayload]).select('id').single();
    if (error) throw new Error(error.message);
    return data?.id || newCargoId;
  },
};
