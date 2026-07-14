// Kiểu dữ liệu cho toàn bộ API báo cáo (/api/v1/reports/*)

export type VehicleType = 'motorcycle' | 'car';

export interface DashboardSummary {
  activeSessions: { total: number; motorcycle: number; car: number };
  completedSessionsToday: number;
  revenueToday: { total: number; fromSessions: number; fromBookings: number; fromSubscriptions: number };
  bookingsToday: { pending: number; confirmed: number };
}

export interface RevenuePoint {
  period: string;
  total: number;
  session: number;
  booking: number;
  subscription: number;
  count: number;
  sessionCount: number;
  bookingCount: number;
  subscriptionCount: number;
  cash: number;
  vnpay: number;
}

export interface RevenueByVehiclePoint {
  period: string;
  motorcycle: number;
  car: number;
  total: number;
}

export interface RevenueComparison {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compare: ComparisonMode;
  current: { from: string; to: string; revenue: number };
  previous: { from: string; to: string; revenue: number };
  changePercent: number | null;
}

export interface SessionStats {
  total: number;
  byVehicleType: Record<string, number>;
  byStatus: Record<string, number>;
  avgDurationMinutes: number;
}

export interface BookingStats {
  total: number;
  byStatus: { pending: number; confirmed: number; cancelled: number; expired: number };
  conversionRate: number;
  noShowRate: number;
  checkedIn: number;
}

export interface SubscriptionStats {
  activeByPlan: Array<{ packageId: number; packageName: string; vehicleType: VehicleType; count: number }>;
  expiringIn7Days: number;
  newSubscriptionsDaily: Array<{ date: string; count: number }>;
}

export interface FloorOccupancy {
  floorId: number;
  floorNumber: string;
  vehicleType: VehicleType;
  floorType: string;
  occupied: number;
  available: number;
  occupancyRate: number;
  // car floors
  totalSlots?: number;
  reserved?: number;
  // motorcycle floors
  totalCapacity?: number;
}

export interface OccupancyTrendPoint {
  date: string;
  floorId: number;
  checkIns: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

export interface PeakDay {
  dayOfWeek: number;
  dayName: string;
  isWeekend: boolean;
  count: number;
}

export interface TopVehicle {
  rank: number;
  licensePlate: string;
  vehicleType: VehicleType;
  sessionCount: number;
  totalFee: number;
  lastSeen: string;
}

export interface TopUser {
  rank: number;
  userId: number;
  fullName: string;
  email: string;
  sessionCount: number;
  totalFee: number;
  lastVisit: string;
}

export interface StaffStat {
  staffId: number;
  staffName: string;
  totalSessions: number;
  completedSessions: number;
  paidSessions: number;
  cashCollected: number;
}

export type GroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type ComparisonMode = 'previous_period' | 'previous_year';
export type DayType = 'weekday' | 'weekend';
