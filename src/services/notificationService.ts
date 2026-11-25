import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { SupabaseNotification } from './supabaseTypes';
import { NotificationItem } from '../types';
import { mockNotifications } from './mockDataProvider';

export const notificationService = {
  async fetchNotifications(userId?: string): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured()) {
      return mockNotifications;
    }

    const client = getSupabaseClient();
    if (!client) return [];

    try {
      let query = client.from('notifications').select('*').order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const { data, error } = await query;
      if (error) {
        // Return mock data if RLS or permissions are not yet configured on Supabase
        return mockNotifications;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: SupabaseNotification) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        timestamp: item.timestamp || (item.created_at ? new Date(item.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : 'هم‌اکنون'),
        category: item.category || 'SYSTEM',
        severity: item.severity || 'INFO',
        isRead: Boolean(item.is_read),
        entityId: item.entity_id,
        entityType: item.entity_type,
        eta: item.eta,
        statusText: item.status_text,
        detailedDescription: item.detailed_description,
      }));
    } catch (err) {
      console.error('Error in notificationService.fetchNotifications:', err);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return true;
    }

    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return !error;
    } catch (err) {
      console.error('Error in notificationService.markAsRead:', err);
      return false;
    }
  },

  async markAllAsRead(userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return true;
    }

    const client = getSupabaseClient();
    if (!client) return false;

    try {
      let query = client.from('notifications').update({ is_read: true });
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('is_read', false);
      }

      const { error } = await query;
      return !error;
    } catch (err) {
      console.error('Error in notificationService.markAllAsRead:', err);
      return false;
    }
  },
};
