import { TripCheckpointItem, TripMilestoneStage } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { mockTripCheckpoints } from './mockDataProvider';

class DriverTripService {
  private localCheckpoints: Record<string, TripCheckpointItem[]> = {
    'TRP-9021': [...mockTripCheckpoints],
  };

  async fetchCheckpoints(tripId: string): Promise<TripCheckpointItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('trip_checkpoints')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: true });

          if (!error && data && data.length > 0) {
            return data.map((c) => ({
              id: c.id,
              stage: c.stage as TripMilestoneStage,
              title: c.title,
              description: c.description || '',
              isCompleted: Boolean(c.is_completed),
              completedAt: c.completed_at ? new Date(c.completed_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : undefined,
              actorRole: c.actor_role,
              otpCode: c.otp_code,
              smartSealCode: c.smart_seal_code,
              photoUrl: c.photo_url,
              signatureUrl: c.signature_url,
            }));
          }
        }
      } catch (err) {
        console.warn('Fallback to local checkpoints:', err);
      }
    }
    return this.localCheckpoints[tripId] || [...mockTripCheckpoints];
  }

  async completeCheckpoint(tripId: string, stage: TripMilestoneStage, metadata?: {
    otpCode?: string;
    photoUrl?: string;
    signatureUrl?: string;
    smartSealCode?: string;
  }): Promise<void> {
    const list = this.localCheckpoints[tripId] || [...mockTripCheckpoints];
    const nowTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    this.localCheckpoints[tripId] = list.map((c) => {
      if (c.stage === stage) {
        return {
          ...c,
          isCompleted: true,
          completedAt: nowTime,
          otpCode: metadata?.otpCode || c.otpCode,
          photoUrl: metadata?.photoUrl || c.photoUrl,
          signatureUrl: metadata?.signatureUrl || c.signatureUrl,
          smartSealCode: metadata?.smartSealCode || c.smartSealCode,
        };
      }
      return c;
    });

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { error } = await client
            .from('trip_checkpoints')
            .update({
              is_completed: true,
              completed_at: new Date().toISOString(),
              otp_code: metadata?.otpCode,
              photo_url: metadata?.photoUrl,
              signature_url: metadata?.signatureUrl,
              smart_seal_code: metadata?.smartSealCode,
            })
            .match({ trip_id: tripId, stage });
          if (error) {
            console.error('Error updating checkpoint in Supabase:', error.message);
            throw new Error(error.message);
          }
        }
      } catch (err) {
        console.error('Error updating checkpoint in Supabase:', err);
        throw err;
      }
    }
  }
}

export const driverTripService = new DriverTripService();
