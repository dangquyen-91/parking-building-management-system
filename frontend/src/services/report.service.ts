import type {
  DashboardSummary,
  RevenuePoint,
  RevenueByVehiclePoint,
  RevenueComparison,
  SessionStats,
  BookingStats,
  SubscriptionStats,
  FloorOccupancy,
  OccupancyTrendPoint,
  PeakHour,
  PeakDay,
  TopVehicle,
  TopUser,
  StaffStat,
  GroupBy,
  DayType,
  VehicleType,
} from '../types/report';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `API error with status ${response.status}`);
  }
  return result.data as T;
}

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('Access token not found');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

async function get<T>(path: string, params: object = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const qs = query.toString();
  const response = await fetch(`${API_BASE_URL}/reports/${path}${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return parseResponse<T>(response);
}

export interface DateRange {
  from?: string;
  to?: string;
}

export const reportService = {
  getDashboard: () => get<DashboardSummary>('dashboard'),

  getRevenue: (params: DateRange & { groupBy?: GroupBy } = {}) =>
    get<RevenuePoint[]>('revenue', params),

  getRevenueByVehicle: (params: DateRange & { groupBy?: GroupBy } = {}) =>
    get<RevenueByVehiclePoint[]>('revenue/by-vehicle', params),

  getRevenueComparison: (period: 'week' | 'month' | 'year' = 'month') =>
    get<RevenueComparison>('revenue/comparison', { period }),

  getSessionStats: (params: DateRange = {}) => get<SessionStats>('sessions', params),

  getBookingStats: (params: DateRange = {}) => get<BookingStats>('bookings', params),

  getSubscriptionStats: (params: DateRange = {}) => get<SubscriptionStats>('subscriptions', params),

  getOccupancy: () => get<FloorOccupancy[]>('occupancy'),

  getOccupancyTrend: (params: DateRange & { floorId?: number } = {}) =>
    get<OccupancyTrendPoint[]>('occupancy/trend', params),

  getPeakHours: (params: DateRange & { days?: number } = {}) => get<PeakHour[]>('peak-hours', params),

  getPeakDays: (params: DateRange & { days?: number } = {}) => get<PeakDay[]>('peak-days', params),

  getTopVehicles: (params: DateRange & { limit?: number; vehicleType?: VehicleType; dayType?: DayType } = {}) =>
    get<TopVehicle[]>('top-vehicles', params),

  getTopUsers: (params: DateRange & { limit?: number } = {}) => get<TopUser[]>('top-users', params),

  getStaffStats: (params: DateRange = {}) => get<StaffStat[]>('staff', params),
};
