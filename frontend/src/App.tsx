import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ui/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden relative">
        <Navbar />
        
        <main>
          <AppRoutes />
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
