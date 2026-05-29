import type { LucideIcon } from 'lucide-react';

export type KpiTrend = 'up' | 'down';

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: KpiTrend;
  icon: LucideIcon;
  tone: 'blue' | 'purple' | 'green' | 'amber' | 'cyan';
}

export interface OccupancyPoint {
  time: string;
  occupancy: number;
}

export interface ZoneUsage {
  name: string;
  value: number;
  color: string;
}

export type ParkingSessionStatus = 'Parking' | 'Completed' | 'Overdue';

export interface ParkingSession {
  id: string;
  plateNumber: string;
  customerName: string;
  checkIn: string;
  checkOut: string;
  fee: string;
  status: ParkingSessionStatus;
}

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled';

export interface Booking {
  id: string;
  code: string;
  plateNumber: string;
  date: string;
  time: string;
  status: BookingStatus;
}

export interface DashboardMeta {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
}

export interface DashboardMockData {
  meta: DashboardMeta;
  kpis: KpiMetric[];
  occupancy: OccupancyPoint[];
  zones: ZoneUsage[];
  sessions: ParkingSession[];
  bookings: Booking[];
}
