import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { SupabaseTransportTrip, SupabaseTripLocation } from './supabaseTypes';
import { TripItem, UserRole } from '../types';
import { mockTrips } from './mockDataProvider';

export const tripService = {
  async fetchTrips(role?: UserRole, userId?: string): Promise<TripItem[]> {
    if (!isSupabaseConfigured()) {
      return mockTrips;
    }

    const client = getSupabaseClient();
    if (!client) return [];

    try {
      let query = client.from('transport_trips').select('*').order('created_at', { ascending: false });

      if (role === 'DRIVER' && userId) {
        query = query.eq('driver_id', userId);
      }

      const { data, error } = await query;
      if (error) {
        // Return mock data if RLS or permissions are not yet configured on Supabase
        return mockTrips;
      }

      // Empty database rule
      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: any) => ({
        id: item.trip_number || item.id,
        cargoId: item.cargo_id || item.cargo_number || 'CRG-GENERAL',
        origin: item.origin || 'مبدا',
        destination: item.destination || 'مقصد',
        departureTime: item.departure_time || item.scheduled_loading_time || '08:00',
        eta: item.eta || (item.scheduled_loading_date ? `${item.scheduled_loading_date}` : '18:00'),
        distanceCoveredKm: Number(item.distance_covered_km) || 0,
        distanceRemainingKm: Number(item.distance_remaining_km) || 0,
        totalDistanceKm: Number(item.total_distance_km) || 0,
        currentSpeedKmH: Number(item.current_speed_kmh) || 0,
        status: item.trip_status || item.status || 'ACTIVE',
        vehicleId: item.vehicle_id || 'TRK-DEFAULT',
        progressPercentage: Number(item.progress_percentage) || 0,
      }));
    } catch (err) {
      console.error('Error in tripService.fetchTrips:', err);
      return [];
    }
  },

  async fetchTripLocations(tripId: string): Promise<SupabaseTripLocation[]> {
    if (!isSupabaseConfigured()) {
      return [
        {
          id: 'loc-1',
          trip_id: tripId,
          latitude: 35.6892,
          longitude: 51.389,
          address: 'تهران، بزرگراه آزادگان',
          speed_kmh: 82,
          recorded_at: new Date().toISOString(),
        },
      ];
    }

    const client = getSupabaseClient();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from('trip_locations')
        .select('*')
        .eq('trip_id', tripId)
        .order('recorded_at', { ascending: false })
        .limit(20);

      if (error || !data) {
        return [];
      }
      return data;
    } catch (err) {
      console.error('Error in tripService.fetchTripLocations:', err);
      return [];
    }
  },
};
