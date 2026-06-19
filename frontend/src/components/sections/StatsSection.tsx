import { motion } from 'framer-motion';
import { Car, Layers, CalendarClock, Users } from 'lucide-react';

const stats = [
  {
    icon: <Car className="h-6 w-6" />,
    value: '2',
    label: 'Loại xe hỗ trợ',
    desc: 'Quản lý riêng cho xe máy và ô tô theo từng tầng.',
  },
  {
    icon: <Layers className="h-6 w-6" />,
    value: '2',
    label: 'Loại tầng đỗ',
    desc: 'Tầng cư dân giữ ô cố định và tầng khách tính phí theo giờ.',
  },
  {
    icon: <CalendarClock className="h-6 w-6" />,
    value: '24h',
    label: 'Đặt chỗ trước',
    desc: 'Giữ chỗ trước tối đa 24 giờ và thanh toán online.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    value: '4',
    label: 'Vai trò người dùng',
    desc: 'Phân quyền Quản trị, Quản lý, Nhân viên và Người dùng.',
  },
];

export default function StatsSection() {
  return (
    <section className="relative z-20 overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.3),transparent_70%)]" />
      <div className="absolute -bottom-24 left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-6 md:px-12">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Con Số Biết Nói
          </h2>
          <h3 className="text-3xl font-bold tracking-tight md:text-5xl">
            Được Tin Dùng Trên Quy Mô Lớn
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-panel-dark flex flex-col items-start rounded-3xl border border-white/10 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                {stat.icon}
              </div>
              <p className="text-4xl font-black tracking-tight text-white md:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-wide text-blue-300">{stat.label}</p>
              <p className="mt-3 text-sm font-light leading-relaxed text-slate-400">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
