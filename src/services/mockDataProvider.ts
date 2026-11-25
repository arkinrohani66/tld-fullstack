import {
  NotificationItem,
  Conversation,
  ChatMessage,
  CargoItem,
  TripItem,
  WalletTransaction,
  RegisteredVehicle,
  CargoBidItem,
  TripCheckpointItem,
  DriverEarningRecord,
  DriverSettlementRecord,
  DriverRatingStats,
  DriverDisputeItem,
} from '../types';

/**
 * داده‌های اولیه خالی جهت شروع کار با دیتای واقعی کاربران
 */
export const mockNotifications: NotificationItem[] = [];

export const mockConversations: Conversation[] = [];

export const mockMessages: Record<string, ChatMessage[]> = {};

export const mockCargos: CargoItem[] = [];

export const mockTrips: TripItem[] = [];

export const mockTransactions: WalletTransaction[] = [];

export const mockDriverVehicles: RegisteredVehicle[] = [];

export const mockDriverBids: CargoBidItem[] = [];

export const mockTripCheckpoints: TripCheckpointItem[] = [];

export const mockDriverEarnings: DriverEarningRecord[] = [];

export const mockDriverSettlements: DriverSettlementRecord[] = [];

export const mockDriverRatings: DriverRatingStats = {
  averageRating: 0,
  totalReviews: 0,
  onTimeDeliveryRate: 100,
  safetyScore: 100,
  cargoIntegrityScore: 100,
  completedTripsCount: 0,
  tier: 'SILVER',
  reviews: [],
};

export const mockDriverDisputes: DriverDisputeItem[] = [];
