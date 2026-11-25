import { DriverRatingStats, DriverReview } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { mockDriverRatings } from './mockDataProvider';

class DriverRatingService {
  private localStats: DriverRatingStats = { ...mockDriverRatings };

  getInitialStats(): DriverRatingStats {
    return {
      ...this.localStats,
      reviews: [...this.localStats.reviews],
    };
  }

  async fetchRatingStats(driverId?: string): Promise<DriverRatingStats> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          // Resolve the driver profile id: explicit id, otherwise the signed-in user
          let profileId = driverId;
          if (!profileId) {
            const { data: userData } = await client.auth.getUser();
            profileId = userData?.user?.id;
          }

          const driverQuery = client
            .from('drivers')
            .select('id, rating, total_trips, on_time_rate, safety_score');
          if (profileId) {
            driverQuery.eq('profile_id', profileId);
          }

          // Timeout after 2.5 seconds to guarantee instant UI rendering
          const queryPromise = Promise.all([
            driverQuery,
            client.from('driver_reviews').select('*').order('created_at', { ascending: false }),
          ]);

          const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
            setTimeout(() => resolve({ timeout: true }), 2500)
          );

          const result: any = await Promise.race([queryPromise, timeoutPromise]);

          if (result && !result.timeout && Array.isArray(result)) {
            const [driverRes, reviewsRes] = result;
            const driverData = Array.isArray(driverRes?.data) ? driverRes.data[0] : driverRes?.data;
            let reviewsData = reviewsRes?.data;

            // Restrict reviews to the resolved driver row
            if (driverData?.id) {
              const { data: ownReviews } = await client
                .from('driver_reviews')
                .select('*')
                .eq('driver_id', driverData.id)
                .order('created_at', { ascending: false });
              reviewsData = ownReviews || [];
            }

            if (driverData) {
              const mappedReviews: DriverReview[] = (reviewsData || []).map((r: any) => ({
                id: r.id,
                shipperName: r.shipper_name || 'صاحب کالا',
                shipperCompany: r.shipper_company || 'صنایع تولیدی',
                rating: Number(r.rating) || 5,
                date: r.created_at ? new Date(r.created_at).toLocaleDateString('fa-IR') : '—',
                comment: r.comment || '',
                tripRoute: r.trip_route || '—',
                tags: r.tags || [],
                cargoType: r.cargo_type,
                waybillNumber: r.waybill_number,
                driverResponse: r.driver_response,
                responseDate: r.response_date
                  ? new Date(r.response_date).toLocaleDateString('fa-IR')
                  : undefined,
              }));

              const avgRating = Number(driverData.rating) || this.localStats.averageRating;
              this.localStats = {
                averageRating: avgRating,
                totalReviews: mappedReviews.length > 0 ? mappedReviews.length : this.localStats.totalReviews,
                onTimeDeliveryRate: Number(driverData.on_time_rate) || this.localStats.onTimeDeliveryRate,
                safetyScore: Number(driverData.safety_score) || this.localStats.safetyScore,
                cargoIntegrityScore: 100,
                completedTripsCount: Number(driverData.total_trips) || this.localStats.completedTripsCount,
                tier: avgRating >= 4.8 ? 'DIAMOND' : avgRating >= 4.3 ? 'GOLD' : 'SILVER',
                reviews: mappedReviews.length > 0 ? mappedReviews : this.localStats.reviews,
              };
            }
          }
        }
      } catch (err) {
        console.warn('Fallback to local driver rating stats:', err);
      }
    }
    return { ...this.localStats, reviews: [...this.localStats.reviews] };
  }

  async submitDriverReply(reviewId: string, replyText: string): Promise<boolean> {
    const trimmed = replyText.trim();
    if (!trimmed) return false;

    const reviewIndex = this.localStats.reviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex !== -1) {
      this.localStats.reviews[reviewIndex] = {
        ...this.localStats.reviews[reviewIndex],
        driverResponse: trimmed,
        responseDate: new Date().toLocaleDateString('fa-IR'),
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { error } = await client
            .from('driver_reviews')
            .update({
              driver_response: trimmed,
              response_date: new Date().toISOString(),
            })
            .eq('id', reviewId);
          if (error) {
            console.warn('Could not persist reply to remote:', error.message);
          }
        }
      } catch (err) {
        console.warn('Could not persist reply to remote:', err);
      }
    }
    return true;
  }

  async submitRatingDispute(reviewId: string, reason: string): Promise<boolean> {
    console.log(`[DriverRatingService] Submitted dispute for review ${reviewId}: ${reason}`);
    return true;
  }
}

export const driverRatingService = new DriverRatingService();
