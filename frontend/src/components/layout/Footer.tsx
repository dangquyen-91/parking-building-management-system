import { Link } from 'react-router-dom';
import { Car, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-slate-950 pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[200px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                <Car size={20} className="stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                ParkEase<span className="text-blue-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Giải pháp quản lý bãi đỗ xe thông minh hàng đầu, mang lại trải nghiệm tiện lợi và an toàn cho thành phố hiện đại.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-6">Sản Phẩm</h4>
            <ul className="space-y-4">
              <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors text-sm">Tính năng nổi bật</Link></li>
              <li><Link to="/membership" className="text-slate-400 hover:text-white transition-colors text-sm">Gói cá nhân</Link></li>
              <li><Link to="/membership" className="text-slate-400 hover:text-white transition-colors text-sm">Giải pháp doanh nghiệp</Link></li>
              <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors text-sm">Hardware tích hợp</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Công Ty</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">Về chúng tôi</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">Tuyển dụng</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">Blog & Tin tức</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-6">Đăng Ký Nhận Tin</h4>
            <p className="text-slate-400 text-sm mb-4">Nhận thông tin cập nhật mới nhất về các tính năng và ưu đãi.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email của bạn..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 ParkEase. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
