import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  NotificationItem,
  Conversation,
  ChatMessage,
  CargoItem,
  TripItem,
  WalletTransaction,
  MessageDeliveryStatus,
} from '../types';
import { cargoService } from '../services/cargoService';
import { tripService } from '../services/tripService';
import { notificationService } from '../services/notificationService';
import { messageService } from '../services/messageService';
import { walletService } from '../services/walletService';
import { isSupabaseConfigured, getSupabaseClient } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface LogisticsContextType {
  // Loading & Connection State
  isLoading: boolean;
  isLiveSupabase: boolean;
  refreshAllData: () => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  selectedNotificationId: string | null;
  setSelectedNotificationId: (id: string | null) => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getNotificationById: (id: string) => NotificationItem | undefined;

  // Messages & Chat
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  getActiveConversation: () => Conversation | undefined;
  getMessagesForConversation: (convId: string) => ChatMessage[];
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  openChatForEntity: (participantName: string, role: string, cargoId?: string) => string;

  // Cargos & Trips
  cargos: CargoItem[];
  selectedCargoId: string | null;
  setSelectedCargoId: (id: string | null) => void;
  trips: TripItem[];
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;
  addCargo: (cargo: Omit<CargoItem, 'id'>) => Promise<string>;

  // Wallet
  walletBalance: string;
  driverIncomeToday: string;
  shipperPendingPayment: string;
  shipperSettledMonth: string;
  monthlyTurnover: string;
  walletTransactions: WalletTransaction[];
  chargeWallet: (amount: string) => Promise<void>;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role, showToast } = useAuth();
  const userId = currentUser?.id;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isLiveSupabase = isSupabaseConfigured();

  // State collections
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(null);

  const [trips, setTrips] = useState<TripItem[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [driverIncomeToday, setDriverIncomeToday] = useState<string>('0');
  const [shipperPendingPayment, setShipperPendingPayment] = useState<string>('0 تومان');
  const [shipperSettledMonth, setShipperSettledMonth] = useState<string>('0 تومان');
  const [monthlyTurnover, setMonthlyTurnover] = useState<string>('0 تومان');

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        loadedNotifications,
        loadedConversations,
        loadedCargos,
        loadedTrips,
        walletSummary,
        loadedTransactions,
      ] = await Promise.all([
        notificationService.fetchNotifications(userId),
        messageService.fetchConversations(),
        cargoService.fetchCargos(role ?? undefined, userId),
        tripService.fetchTrips(role ?? undefined, userId),
        walletService.fetchWalletSummary(userId),
        walletService.fetchTransactions(userId),
      ]);

      setNotifications(loadedNotifications);
      setSelectedNotificationId((prev) => prev ?? (loadedNotifications[0]?.id ?? null));

      setConversations(loadedConversations);
      // Keep the user's active conversation when it still exists
      setActiveConversationId((prev) => {
        if (prev && loadedConversations.some((c) => c.id === prev)) return prev;
        return loadedConversations[0]?.id ?? '';
      });

      setCargos(loadedCargos);
      setSelectedCargoId((prev) => prev ?? (loadedCargos[0]?.id ?? null));

      setTrips(loadedTrips);
      setSelectedTripId((prev) => prev ?? (loadedTrips[0]?.id ?? null));

      setWalletBalance(walletSummary.walletBalance);
      setDriverIncomeToday(walletSummary.driverIncomeToday);
      setShipperPendingPayment(walletSummary.shipperPendingPayment);
      setShipperSettledMonth(walletSummary.shipperSettledMonth);
      setMonthlyTurnover(walletSummary.monthlyTurnover);
      setWalletTransactions(loadedTransactions);
    } catch (err) {
      console.error('Error in LogisticsProvider.refreshAllData:', err);
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  // Refresh once on mount and whenever the signed-in user/role changes
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle active conversation message loading
  useEffect(() => {
    if (activeConversationId && !messages[activeConversationId]) {
      messageService.fetchMessages(activeConversationId).then((loaded) => {
        setMessages((prev) => ({ ...prev, [activeConversationId]: loaded }));
      });
    }
  }, [activeConversationId, messages]);

  // Realtime Supabase Subscription if Supabase is configured
  useEffect(() => {
    if (!isLiveSupabase) return;
    const client = getSupabaseClient();
    if (!client) return;

    // Listen to changes in notifications
    const notifChannel = client
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        notificationService.fetchNotifications(userId).then(setNotifications);
      })
      .subscribe();

    // Listen to changes in cargos
    const cargoChannel = client
      .channel('public:cargos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargos' }, () => {
        cargoService.fetchCargos(role ?? undefined, userId).then(setCargos);
      })
      .subscribe();

    // Listen to changes in trips
    const tripChannel = client
      .channel('public:transport_trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_trips' }, () => {
        tripService.fetchTrips(role ?? undefined, userId).then(setTrips);
      })
      .subscribe();

    return () => {
      client.removeChannel(notifChannel);
      client.removeChannel(cargoChannel);
      client.removeChannel(tripChannel);
    };
  }, [isLiveSupabase, role, userId]);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await notificationService.markAsRead(id);
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await notificationService.markAllAsRead(userId);
  };

  const getNotificationById = (id: string) => {
    return notifications.find((n) => n.id === id);
  };

  const getActiveConversation = () => {
    return conversations.find((c) => c.id === activeConversationId);
  };

  const getMessagesForConversation = (convId: string) => {
    return messages[convId] || [];
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsgId = `msg-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: newMsgId,
      conversationId,
      senderId: currentUser?.id || 'current_user',
      senderName: currentUser?.profile?.fullName || 'من',
      text: text.trim(),
      timestamp: timeStr,
      status: 'SENDING',
      isOutgoing: true,
    };

    // Optimistic append
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: text.trim(), lastMessageTime: timeStr }
          : c
      )
    );

    if (!isLiveSupabase || conversationId.startsWith('conv_')) {
      // Local/mock conversation: simulate the delivery lifecycle
      const setMsgStatus = (status: MessageDeliveryStatus, delay: number) =>
        setTimeout(() => {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map((m) =>
              m.id === newMsgId ? { ...m, status } : m
            ),
          }));
        }, delay);

      setMsgStatus('SENT', 400);
      setMsgStatus('DELIVERED', 1200);
      setMsgStatus('READ', 2200);
      return;
    }

    const result = await messageService.sendMessage(
      conversationId,
      text,
      newMsg.senderId,
      newMsg.senderName,
      role === 'DRIVER' ? 'DRIVER' : 'SHIPPER'
    );

    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) =>
        m.id === newMsgId ? { ...m, status: result.status } : m
      ),
    }));

    if (result.status === 'FAILED') {
      showToast('error', 'ارسال پیام ناموفق بود. اتصال خود را بررسی کنید.');
    }
  };

  const openChatForEntity = (participantName: string, role: string, cargoId?: string): string => {
    const existing = conversations.find(
      (c) => c.participantName.includes(participantName) || (cargoId && c.cargoId === cargoId)
    );
    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const buildLocal = (id: string): Conversation => ({
      id,
      participantName,
      participantRole: role,
      participantAvatar: 'https://i.pravatar.cc/80?u=' + encodeURIComponent(participantName),
      onlineStatus: 'ONLINE',
      lastMessage: 'گفتگوی جدید آغاز شد',
      lastMessageTime: 'هم‌اکنون',
      unreadCount: 0,
      cargoId,
      statusType: 'NORMAL',
    });

    // Live mode: persist a real conversation row and use its UUID
    if (isLiveSupabase) {
      const localId = `conv_${Date.now()}`;
      const localConv = buildLocal(localId);
      setConversations((prev) => [localConv, ...prev]);
      setActiveConversationId(localId);

      messageService
        .createConversation({ participantName, participantRole: role, cargoId })
        .then((created) => {
          if (created) {
            setConversations((prev) =>
              prev.map((c) => (c.id === localId ? created : c))
            );
            setActiveConversationId(created.id);
          }
        });
      return localId;
    }

    const newConv = buildLocal(`conv_${Date.now()}`);
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    return newConv.id;
  };

  const addCargo = async (cargo: Omit<CargoItem, 'id'>): Promise<string> => {
    const newId = await cargoService.addCargo(
      {
        title: cargo.title,
        origin: cargo.origin,
        destination: cargo.destination,
        weight: cargo.weight,
        truckType: cargo.truckType,
      },
      currentUser?.id
    );
    const newCargo: CargoItem = {
      ...cargo,
      id: newId,
    };
    setCargos((prev) => [newCargo, ...prev]);
    setSelectedCargoId(newId);
    return newId;
  };

  /**
   * Wallet top-up needs a payment gateway which is not connected yet.
   * Never pretend money was added.
   */
  const chargeWallet = async (_amount: string) => {
    const tx = await walletService.chargeWallet(_amount, currentUser?.id);
    if (!tx) {
      showToast(
        'info',
        'اتصال درگاه پرداخت هنوز فعال نیست؛ لذا مبلغی از حساب شما کسر یا به کیف پول اضافه نشد.'
      );
    }
  };

  return (
    <LogisticsContext.Provider
      value={{
        isLoading,
        isLiveSupabase,
        refreshAllData,
        notifications,
        unreadNotificationCount,
        selectedNotificationId,
        setSelectedNotificationId,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        getNotificationById,
        conversations,
        activeConversationId,
        setActiveConversationId,
        getActiveConversation,
        getMessagesForConversation,
        sendMessage,
        openChatForEntity,
        cargos,
        selectedCargoId,
        setSelectedCargoId,
        trips,
        selectedTripId,
        setSelectedTripId,
        addCargo,
        walletBalance,
        driverIncomeToday,
        shipperPendingPayment,
        shipperSettledMonth,
        monthlyTurnover,
        walletTransactions,
        chargeWallet,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = (): LogisticsContextType => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
