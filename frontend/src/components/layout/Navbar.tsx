import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); setDropdownOpen(false); }, [location]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const navLinks = [
    { name: 'Trang Chủ', href: '/' },
    { name: 'Tính Năng', href: '/features' },
    { name: 'Gói Dịch Vụ', href: '/membership' },
    ...(isAuthenticated ? [{ name: 'Đặt Chỗ Của Tôi', href: '/my-bookings' }] : []),
    { name: 'Về Chúng Tôi', href: '/about' },
    { name: 'Liên Hệ', href: '/contact' },
  ];

  const isHome = location.pathname === '/';
  const isLight = scrolled || !isHome;
  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase() ?? '?';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLight
          ? 'py-4 glass-panel shadow-sm text-slate-900 border-b border-slate-200/50'
          : 'py-6 bg-transparent text-white'
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Car size={24} className="stroke-[2.5]" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            ParkEase<span className="text-blue-500">.</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.href}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-blue-500 relative py-1 ${
                  isActive
                    ? 'text-blue-500 font-semibold'
                    : isLight
                    ? 'text-slate-600'
                    : 'text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.name}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 transition-all ${
                  isLight
                    ? 'border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-white shadow-sm'
                    : 'border-white/20 bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-black text-white">
                  {initials}
                </div>
                <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {user.fullName.split(' ').slice(-1)[0]}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${
                    isLight ? 'text-slate-400' : 'text-slate-300'
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
                  >
                    <div className="px-3 pb-2.5 pt-1.5 border-b border-slate-100 mb-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <User className="h-4 w-4" />
                      Hồ sơ của tôi
                    </Link>

                    <div className="mt-1 border-t border-slate-100 pt-1">
                      <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  isLight
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'border-white/20 text-white hover:bg-white/10'
                }`}
              >
                Sign Up
              </Link>
            </>
          )}

          <Link
            to="/booking"
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 inline-block"
          >
            Đặt Chỗ Ngay
          </Link>
        </div>

        <button
          className={`md:hidden p-2 rounded-lg ${isLight ? 'text-slate-900' : 'text-white'}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 glass-panel border-t border-white/20 p-6 flex flex-col gap-4 shadow-xl md:hidden"
          >
            {navLinks.map((link, idx) => (
              <NavLink
                key={idx}
                to={link.href}
                className={({ isActive }) =>
                  `font-medium py-2 border-b border-slate-200/50 ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-800'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <div className="mt-4 flex flex-col gap-3">
              <Link
                to="/booking"
                className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium w-full shadow-lg text-center inline-block"
              >
                Đặt Chỗ Ngay
              </Link>
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="text-sm font-semibold text-slate-800 px-2">
                    Tài khoản: <span className="text-blue-600">{user.fullName}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="px-4 py-2.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 font-medium text-sm text-center shadow-sm w-full inline-block"
                  >
                    Hồ sơ của tôi
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium text-sm text-center shadow-sm w-full cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Link
                    to="/login"
                    className="px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-800 font-medium text-sm text-center shadow-sm inline-block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2.5 rounded-full bg-slate-950 text-white font-medium text-sm text-center shadow-sm inline-block"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
