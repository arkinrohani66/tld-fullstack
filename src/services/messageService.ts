import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { SupabaseConversation, SupabaseMessage } from './supabaseTypes';
import { Conversation, ChatMessage, MessageDeliveryStatus } from '../types';
import { mockConversations, mockMessages } from './mockDataProvider';

const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const messageService = {
  async fetchConversations(): Promise<Conversation[]> {
    if (!isSupabaseConfigured()) {
      return mockConversations;
    }

    const client = getSupabaseClient();
    if (!client) return mockConversations;

    try {
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        // Fallback to mock data if RLS or permissions are not yet configured on Supabase
        return mockConversations;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: SupabaseConversation) => ({
        id: item.id,
        participantName: item.participant_name,
        participantRole: item.participant_role,
        participantAvatar: item.participant_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        onlineStatus: item.online_status || 'ONLINE',
        lastMessage: item.last_message || '',
        lastMessageTime: item.last_message_time || '',
        unreadCount: Number(item.unread_count) || 0,
        cargoId: item.cargo_id,
        statusType: item.status_type || 'NORMAL',
      }));
    } catch (err) {
      return mockConversations;
    }
  },

  async fetchMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured() || !isUUID(conversationId)) {
      return mockMessages[conversationId] || [];
    }

    const client = getSupabaseClient();
    if (!client) return mockMessages[conversationId] || [];

    try {
      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        return mockMessages[conversationId] || [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: SupabaseMessage) => ({
        id: item.id,
        conversationId: item.conversation_id,
        senderId: item.sender_id,
        senderName: item.sender_name || 'کاربر',
        senderAvatar: item.sender_avatar,
        senderRole: item.sender_role,
        text: item.text,
        timestamp: item.timestamp || (item.created_at ? new Date(item.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''),
        status: (item.status as MessageDeliveryStatus) || 'DELIVERED',
        isOutgoing: Boolean(item.is_outgoing),
        isSystemAlert: Boolean(item.is_system_alert),
      }));
    } catch (err) {
      return mockMessages[conversationId] || [];
    }
  },

  async sendMessage(
    conversationId: string,
    text: string,
    senderId: string,
    senderName: string,
    senderRole?: 'DRIVER' | 'SHIPPER' | 'DISPATCHER' | 'SYSTEM'
  ): Promise<ChatMessage> {
    const timeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const newMsgId = `msg-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: newMsgId,
      conversationId,
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: timeStr,
      status: 'SENDING',
      isOutgoing: true,
    };

    if (!isSupabaseConfigured() || !isUUID(conversationId)) {
      return newMsg;
    }

    const client = getSupabaseClient();
    if (!client) return newMsg;

    try {
      const { error: insertError } = await client.from('messages').insert([
        {
          id: newMsgId,
          conversation_id: conversationId,
          sender_id: senderId,
          sender_name: senderName,
          sender_role: senderRole,
          text: text.trim(),
          timestamp: timeStr,
          status: 'SENT',
          is_outgoing: true,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.warn('sendMessage insert failed:', insertError.message);
        return { ...newMsg, status: 'FAILED' };
      }

      // Update conversation last message
      await client
        .from('conversations')
        .update({
          last_message: text.trim(),
          last_message_time: timeStr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return { ...newMsg, status: 'SENT' };
    } catch (err) {
      return { ...newMsg, status: 'FAILED' };
    }
  },

  /**
   * Persists a new conversation for the current user and returns its real UUID.
   * Returns null when Supabase is not configured.
   */
  async createConversation(payload: {
    participantName: string;
    participantRole: string;
    participantAvatar?: string;
    cargoId?: string;
  }): Promise<Conversation | null> {
    if (!isSupabaseConfigured()) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('conversations')
        .insert({
          participant_name: payload.participantName,
          participant_role: payload.participantRole,
          participant_avatar: payload.participantAvatar,
          cargo_id: payload.cargoId || null,
          last_message: 'گفتگوی جدید آغاز شد',
          last_message_time: 'هم‌اکنون',
        })
        .select('*')
        .single();

      if (error || !data) {
        console.warn('createConversation failed:', error?.message);
        return null;
      }

      return {
        id: data.id,
        participantName: data.participant_name,
        participantRole: data.participant_role,
        participantAvatar: data.participant_avatar || '',
        onlineStatus: data.online_status || 'ONLINE',
        lastMessage: data.last_message || '',
        lastMessageTime: data.last_message_time || '',
        unreadCount: 0,
        cargoId: data.cargo_id || undefined,
        statusType: data.status_type || 'NORMAL',
      };
    } catch (err) {
      console.warn('createConversation exception:', err);
      return null;
    }
  },
};
