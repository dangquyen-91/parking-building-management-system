import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Features from '../pages/Features';
import Membership from '../pages/Membership';
import PaymentReturnPage from '../pages/PaymentReturnPage';
import BookingPage from '../pages/BookingPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import About from '../pages/About';
import Contact from '../pages/Contact';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminUsersPage from '../pages/admin/UsersPage';
import AdminBuildingsPage from '../pages/admin/BuildingsPage';
import AdminFloorsPage from '../pages/admin/FloorsPage';
import AdminSlotsPage from '../pages/admin/SlotsPage';
import AdminPackagesPage from '../pages/admin/PackagesPage';
import AdminPaymentsPage from '../pages/admin/PaymentsPage';
import ManagerDashboardPage from '../pages/manager/DashboardPage';
import ManagerUsersPage from '../pages/manager/UsersPage';
import ManagerBuildingsPage from '../pages/manager/BuildingsPage';
import ManagerFloorsPage from '../pages/manager/FloorsPage';
import ManagerSlotsPage from '../pages/manager/SlotsPage';
import ManagerPackagesPage from '../pages/manager/PackagesPage';
import ManagerPaymentsPage from '../pages/manager/PaymentsPage';
import ManagerStaffPage from '../pages/manager/StaffPage';
import CheckInPage from '../pages/staff/CheckInPage';
import CheckOutPage from '../pages/staff/CheckOutPage';
import ActiveSessionsPage from '../pages/staff/ActiveSessionsPage';
import StaffDashboardPage from '../pages/staff/StaffDashboardPage';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

// ─── Admin guard (admin only) ─────────────────────────────────────────────────
function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070B14] text-white">
        <div className="h-10 w-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ManagerRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070B14] text-white">
        <div className="h-10 w-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowed = ['manager', 'admin'];
  if (!user?.role || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ─── Staff guard (staff, manager, admin all allowed) ─────────────────────────
function StaffRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070B14] text-white">
        <div className="h-10 w-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowed = ['staff', 'manager', 'admin'];
  if (!user?.role || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Home />} />
      <Route path="/features" element={<Features />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/payment" element={<PaymentReturnPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/buildings" element={<AdminRoute><AdminBuildingsPage /></AdminRoute>} />
      <Route path="/admin/floors" element={<AdminRoute><AdminFloorsPage /></AdminRoute>} />
      <Route path="/admin/slots" element={<AdminRoute><AdminSlotsPage /></AdminRoute>} />
      <Route path="/admin/payments" element={<AdminRoute><AdminPaymentsPage /></AdminRoute>} />
      <Route path="/admin/packages" element={<AdminRoute><AdminPackagesPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

      {/* ── Manager ── */}
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route path="/manager/dashboard" element={<ManagerRoute><ManagerDashboardPage /></ManagerRoute>} />
      <Route path="/manager/buildings" element={<ManagerRoute><ManagerBuildingsPage /></ManagerRoute>} />
      <Route path="/manager/floors" element={<ManagerRoute><ManagerFloorsPage /></ManagerRoute>} />
      <Route path="/manager/slots" element={<ManagerRoute><ManagerSlotsPage /></ManagerRoute>} />
      <Route path="/manager/payments" element={<ManagerRoute><ManagerPaymentsPage /></ManagerRoute>} />
      <Route path="/manager/packages" element={<ManagerRoute><ManagerPackagesPage /></ManagerRoute>} />
      <Route path="/manager/users" element={<ManagerRoute><ManagerUsersPage /></ManagerRoute>} />
      <Route path="/manager/staff" element={<ManagerRoute><ManagerStaffPage /></ManagerRoute>} />

      {/* ── Staff Kiosk ── */}
      <Route path="/staff" element={<Navigate to="/staff/check-in" replace />} />
      <Route path="/staff/check-in" element={<StaffRoute><CheckInPage /></StaffRoute>} />
      {/* Placeholder routes — pages will be added iteratively */}
      <Route path="/staff/check-out" element={<StaffRoute><CheckOutPage /></StaffRoute>} />
      <Route path="/staff/sessions" element={<StaffRoute><ActiveSessionsPage /></StaffRoute>} />
      <Route path="/staff/map" element={<StaffRoute><CheckInPage /></StaffRoute>} />
      <Route path="/staff/dashboard" element={<StaffRoute><StaffDashboardPage /></StaffRoute>} />
    </Routes>
  );
}

