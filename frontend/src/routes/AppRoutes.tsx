import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Features from '../pages/Features';
import Membership from '../pages/Membership';
import About from '../pages/About';
import Contact from '../pages/Contact';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import DashboardPage from '../pages/admin/DashboardPage';
import { useAuth } from '../hooks/useAuth';

function AdminRoute() {
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

  return <DashboardPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/features" element={<Features />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminRoute />} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

