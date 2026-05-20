import { motion } from 'framer-motion';
import { Target, Eye, Rocket, Leaf } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "Sứ Mệnh Của Chúng Tôi",
      desc: "Giải quyết bài toán ùn ứ và lãng phí thời gian tại các đô thị lớn thông qua các nền tảng công nghệ số hóa hạ tầng tĩnh."
    },
    {
      icon: <Eye className="w-6 h-6 text-blue-600" />,
      title: "Tầm Nhìn 2030",
      desc: "Trở thành hệ sinh thái quản lý đỗ xe thông minh hàng đầu khu vực, kết nối tất cả các tòa nhà thương mại và chung cư hiện đại."
    },
    {
      icon: <Rocket className="w-6 h-6 text-blue-600" />,
      title: "Công Nghệ Tiên Phong",
      desc: "Áp dụng trí tuệ nhân tạo, máy học thế hệ mới kết hợp cùng phần cứng IoT đạt độ trễ cực thấp trong nhận diện biển số xe."
    },
    {
      icon: <Leaf className="w-6 h-6 text-blue-600" />,
      title: "Phát Triển Bền Vững",
      desc: "Hạn chế lượng khí thải carbon phát sinh từ thói quen rà phanh xe đi lòng vòng tìm kiếm slot đỗ trong các tòa nhà."
    }
  ];

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 md:px-12">
        
        {/* Intro Section */}
        <div className="max-w-4xl mx-auto text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-8"
          >
            Định Hình Lại <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600">Hạ Tầng Tĩnh Thông Minh</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto"
          >
            ParkEase bắt đầu với ý tưởng đơn giản: Gửi xe phải là một trải nghiệm không chạm, không gây căng thẳng. Chúng tôi phát triển các công nghệ tích hợp giúp đô thị hóa hiện đại trở nên thông minh và dễ thở hơn.
          </motion.p>
        </div>

        {/* Cinematic Vision Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative bg-slate-950 text-white rounded-[40px] p-8 md:p-20 overflow-hidden max-w-6xl mx-auto mb-28 border border-white/10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-cyan-400 font-semibold tracking-wider uppercase text-sm mb-3">Tối Ưu Hóa Đô Thị</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">Kết Nối Xe Và Tòa Nhà Một Cách Logic</h3>
            <p className="text-slate-400 font-light leading-relaxed text-base mb-8">
              Chúng tôi tạo ra cầu nối liên tục giữa hệ thống định vị của người lái xe và hệ thống kiểm soát cơ điện của tòa nhà gửi xe thông minh. Xe của bạn được chỉ đường trực tiếp tới vị trí trống đã đặt trước mà không tốn 1 giây rà soát.
            </p>
            <div className="flex gap-12 border-t border-white/10 pt-8">
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">85%</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Giảm thời gian chờ</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">98%</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Độ chính xác AI</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Values / Concept */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Các Giá Trị Cốt Lõi</h2>
            <p className="text-slate-600 font-light">Những định hướng nền tảng để chúng tôi không ngừng cải tiến.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex gap-6 items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-blue-600">
                  {val.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{val.title}</h4>
                  <p className="text-slate-600 text-sm font-light leading-relaxed">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
