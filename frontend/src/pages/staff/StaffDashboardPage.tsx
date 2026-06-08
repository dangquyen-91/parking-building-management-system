import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { KpiCards } from '../../components/dashboard/KpiCards';
import { OccupancyChart } from '../../components/dashboard/OccupancyChart';
import { RecentBookings } from '../../components/dashboard/RecentBookings';
import { RecentSessions } from '../../components/dashboard/RecentSessions';
import { ZoneChart } from '../../components/dashboard/ZoneChart';
import {
  Car,
  CalendarCheck,
  ParkingCircle,
  SquareParking,
  Zap,
} from 'lucide-react';
import type { DashboardMockData } from '../../types/dashboard';

// ─── Mock data cho Staff Dashboard (ca trực hiện tại) ────────────────────────
const staffDashboardData: DashboardMockData = {
  meta: {
    eyebrow: 'Bảng điều khiển nhân viên',
    title: 'Tổng quan ca trực',
    subtitle:
      'Theo dõi xe ra vào, chỗ trống còn lại và các đặt chỗ đang chờ xác nhận trong ca trực hôm nay.',
    lastUpdated: new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
  kpis: [
    {
      id: 'vehicles-today',
      title: 'Xe vào hôm nay',
      value: '84',
      change: '+12.3%',
      trend: 'up',
      icon: Car,
      tone: 'blue',
    },
    {
      id: 'active-sessions',
      title: 'Đang gửi xe',
      value: '57',
      change: '+4.7%',
      trend: 'up',
      icon: Zap,
      tone: 'purple',
    },
    {
      id: 'available-slots',
      title: 'Chỗ trống',
      value: '77',
      change: '-8.2%',
      trend: 'down',
      icon: SquareParking,
      tone: 'green',
    },
    {
      id: 'occupied-slots',
      title: 'Chỗ đang dùng',
      value: '183',
      change: '+9.1%',
      trend: 'up',
      icon: ParkingCircle,
      tone: 'cyan',
    },
    {
      id: 'pending-bookings',
      title: 'Đặt chỗ chờ xử lý',
      value: '12',
      change: '+2.0%',
      trend: 'up',
      icon: CalendarCheck,
      tone: 'amber',
    },
  ],
  occupancy: [
    { time: '06:00', occupancy: 18 },
    { time: '08:00', occupancy: 44 },
    { time: '10:00', occupancy: 61 },
    { time: '12:00', occupancy: 70 },
    { time: '14:00', occupancy: 65 },
    { time: '16:00', occupancy: 78 },
    { time: '18:00', occupancy: 88 },
    { time: '20:00', occupancy: 72 },
    { time: '22:00', occupancy: 41 },
  ],
  zones: [
    { name: 'Tầng 1', value: 92, color: '#3B82F6' },
    { name: 'Tầng 2', value: 78, color: '#8B5CF6' },
    { name: 'Tầng 3', value: 61, color: '#22C55E' },
    { name: 'Tầng 4', value: 54, color: '#F59E0B' },
    { name: 'Tầng 5', value: 38, color: '#EF4444' },
  ],
  sessions: [
    {
      id: 'SES-5041',
      plateNumber: '51A-123.45',
      customerName: 'Nguyễn Văn An',
      checkIn: '07:30',
      checkOut: '--',
      fee: '0 VND',
      status: 'Parking',
    },
    {
      id: 'SES-5042',
      plateNumber: '54C-789.45',
      customerName: 'Trần Thị Bảo',
      checkIn: '08:10',
      checkOut: '10:55',
      fee: '52,000 VND',
      status: 'Completed',
    },
    {
      id: 'SES-5043',
      plateNumber: '30H-441.20',
      customerName: 'Lê Minh Tuấn',
      checkIn: '09:00',
      checkOut: '--',
      fee: '88,000 VND',
      status: 'Overdue',
    },
    {
      id: 'SES-5044',
      plateNumber: '51G-204.77',
      customerName: 'Phạm Thanh Hà',
      checkIn: '10:15',
      checkOut: '--',
      fee: '28,000 VND',
      status: 'Parking',
    },
    {
      id: 'SES-5045',
      plateNumber: '60B-551.18',
      customerName: 'Đỗ Hoàng Nam',
      checkIn: '11:42',
      checkOut: '13:20',
      fee: '40,000 VND',
      status: 'Completed',
    },
  ],
  bookings: [
    {
      id: 'BK-3011',
      code: 'SPB-2026-3011',
      plateNumber: '51A-839.24',
      date: new Date().toLocaleDateString('vi-VN'),
      time: '14:30',
      status: 'Confirmed',
    },
    {
      id: 'BK-3012',
      code: 'SPB-2026-3012',
      plateNumber: '30K-192.65',
      date: new Date().toLocaleDateString('vi-VN'),
      time: '15:00',
      status: 'Pending',
    },
    {
      id: 'BK-3013',
      code: 'SPB-2026-3013',
      plateNumber: '60B-551.18',
      date: new Date().toLocaleDateString('vi-VN'),
      time: '16:45',
      status: 'Pending',
    },
    {
      id: 'BK-3014',
      code: 'SPB-2026-3014',
      plateNumber: '51H-778.09',
      date: new Date().toLocaleDateString('vi-VN'),
      time: '18:15',
      status: 'Cancelled',
    },
  ],
};

export default function StaffDashboardPage() {
  return (
    <KioskLayout
      eyebrow={staffDashboardData.meta.eyebrow}
      title={staffDashboardData.meta.title}
      subtitle={staffDashboardData.meta.subtitle}
      headerRight={
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 backdrop-blur-xl">
          Cập nhật lần cuối:{' '}
          <span className="font-semibold text-white">
            {staffDashboardData.meta.lastUpdated}
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        <KpiCards metrics={staffDashboardData.kpis} />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.85fr)]">
          <OccupancyChart data={staffDashboardData.occupancy} />
          <ZoneChart data={staffDashboardData.zones} />
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <RecentSessions sessions={staffDashboardData.sessions} />
          <RecentBookings bookings={staffDashboardData.bookings} />
        </div>
      </div>
    </KioskLayout>
  );
}
