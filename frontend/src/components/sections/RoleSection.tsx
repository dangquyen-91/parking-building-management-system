import { motion } from 'framer-motion';
import { UserCheck, Shield, Key, Car } from 'lucide-react';

export default function RoleSection() {
  const roles = [
    {
      icon: <UserCheck className="w-6 h-6 text-blue-600" />,
      roleTitle: "Parking Manager",
      features: [
        "Quản lý vị trí, phân khu đỗ",
        "Cấu hình phân tầng loại xe",
        "Báo cáo & thống kê doanh thu"
      ],
      description: "Dành cho quản lý tòa nhà giám sát toàn bộ hoạt động đỗ xe và hiệu năng lấp đầy."
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      roleTitle: "Parking Staff",
      features: [
        "Hỗ trợ check-in / check-out",
        "Quét thủ công biển số khi cần",
        "Xử lý ngoại lệ & sự cố lối vào"
      ],
      description: "Hỗ trợ nhân viên bảo vệ, kiểm soát viên vận hành lối vào bãi đỗ xe mượt mà."
    },
    {
      icon: <Car className="w-6 h-6 text-blue-600" />,
      roleTitle: "Parking User / Driver",
      features: [
        "Tìm kiếm và đặt chỗ trước",
        "Theo dõi hành trình gửi xe",
        "Thanh toán nhanh qua QR / Ví"
      ],
      description: "Trải nghiệm tối giản cho lái xe, loại bỏ thời gian tìm kiếm chỗ đỗ truyền thống."
    },
    {
      icon: <Key className="w-6 h-6 text-blue-600" />,
      roleTitle: "System Administrator",
      features: [
        "Quản lý tài khoản toàn hệ thống",
        "Phân quyền phân vai chi tiết",
        "Cấu hình tích hợp thiết bị IoT"
      ],
      description: "Dành cho quản trị viên kỹ thuật cấu hình hệ thống, đảm bảo tính liên tục của dữ liệu."
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-3">Vai Trò Hệ Thống</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight font-sans">Giải Pháp Phân Quyền Thông Minh</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-light">
            Thiết kế giao diện được tối ưu hóa cho từng vai trò người dùng trong luồng vận hành của tòa nhà gửi xe thông minh.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                  {role.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{role.roleTitle}</h4>
                <p className="text-slate-500 text-sm mb-6 font-light">{role.description}</p>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-2">
                <ul className="space-y-3">
                  {role.features.map((feature, fIdx) => (
                    <li key={fIdx} className="text-slate-700 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                      <span className="font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
