import { BrowserRouter, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ui/ScrollToTop';
import { AuthProvider } from './hooks/useAuth';

function AppContent() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/signin', '/signup'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const isManagerPage = location.pathname.startsWith('/manager');
  const isStaffPage = location.pathname.startsWith('/staff');
  const isDashboardPage = isAdminPage || isManagerPage || isStaffPage;

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden relative">
      {!isAuthPage && !isDashboardPage && <Navbar />}
      
      <main>
        <AppRoutes />
      </main>

      {!isAuthPage && !isDashboardPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

