import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Car, Check, Motorbike, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PackageSectionProps {
  isPreview?: boolean;
}

type Plan = {
  name: string;
  vehicleType: 'motorcycle' | 'car';
  price: number;
  durationDays: number;
  saving?: string;
  tag?: string;
  desc: string;
  features: string[];
};

const plans: Plan[] = [
  {
    name: 'Xe máy hàng tháng',
    vehicleType: 'motorcycle',
    price: 150000,
    durationDays: 30,
    desc: 'Gửi xe máy 1 tháng cho cư dân di chuyển hằng ngày.',
    features: ['Check-in cư dân', 'Checkout phí 0', 'Không cần giữ slot cố định'],
  },
  {
    name: 'Xe máy hàng quý',
    vehicleType: 'motorcycle',
    price: 400000,
    durationDays: 90,
    saving: 'Tiết kiệm 50.000đ',
    tag: 'Phổ biến',
    desc: 'Gửi xe máy 3 tháng với chi phí tốt hơn gói tháng.',
    features: ['Quyền cư dân 90 ngày', 'Checkout phí 0', 'Thanh toán VNPay một lần'],
  },
  {
    name: 'Ô tô hàng tháng',
    vehicleType: 'car',
    price: 1500000,
    durationDays: 30,
    desc: 'Gửi ô tô 1 tháng và chọn ô cư dân khi đăng ký.',
    features: ['Giữ ô cư dân', 'Check-in cư dân', 'Checkout phí 0'],
  },
  {
    name: 'Ô tô hàng quý',
    vehicleType: 'car',
    price: 4000000,
    durationDays: 90,
    saving: 'Tiết kiệm 500.000đ',
    tag: 'Tiết kiệm nhất',
    desc: 'Gửi ô tô 3 tháng, phù hợp cư dân sử dụng thường xuyên.',
    features: ['Giữ ô dài hạn', 'Quyền cư dân 90 ngày', 'Thanh toán VNPay một lần'],
  },
];

const formatCurrency = (value: number) =>
  value
    .toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
    .replace(/\s/g, '');

const vehicleLabel = {
  car: 'Ô tô',
  motorcycle: 'Xe máy',
};

export default function PackageSection({ isPreview = false }: PackageSectionProps) {
  return (
    <section id="pricing" className="relative z-20 overflow-hidden bg-[#f7fbff] py-24">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Gói thành viên
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            Chọn gói cư dân, check-in bằng biển số
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-8 text-slate-600">
            Mua gói một lần qua VNPay. Khi gói active, staff chỉ cần nhập biển số để check-in cư dân.
          </p>
        </div>

        <div className="mx-auto grid max-w-[1480px] items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => {
            const quarterly = plan.durationDays > 30;
            const Icon = plan.vehicleType === 'car' ? Car : Motorbike;

            return (
              <motion.article
                key={plan.name}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.42, delay: index * 0.05 }}
                className={cn(
                  'group relative flex min-h-[390px] flex-col overflow-hidden rounded-[22px] border bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(37,99,235,0.13)]',
                  quarterly ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-300 opacity-0 transition group-hover:opacity-100" />

                {plan.tag && (
                  <div className="absolute right-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
                    {plan.tag}
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 pr-16">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {vehicleLabel[plan.vehicleType]}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {plan.durationDays} ngày
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">{plan.name}</h3>
                  </div>

                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-110',
                      plan.vehicleType === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-4 min-h-[48px] text-sm font-light leading-6 text-slate-600">{plan.desc}</p>

                <div className="mt-5">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black tracking-tight text-slate-950">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="mb-1.5 text-sm font-light text-slate-500">/{plan.durationDays} ngày</span>
                  </div>
                  {plan.saving ? (
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {plan.saving}
                    </span>
                  ) : (
                    <span className="mt-2 inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                      Linh hoạt theo tháng
                    </span>
                  )}
                </div>

                <div className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                      <span className="text-sm font-light text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/membership"
                  className={cn(
                    'mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition',
                    quarterly
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500'
                      : 'border-slate-200 bg-slate-50 text-slate-950 hover:border-blue-300 hover:text-blue-600'
                  )}
                >
                  Chọn gói
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </motion.article>
            );
          })}
        </div>

        {isPreview && (
          <div className="mt-12 flex justify-center">
            <Link
              to="/membership"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 hover:shadow-md"
            >
              Xem trang mua gói
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
