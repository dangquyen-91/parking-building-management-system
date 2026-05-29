import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { KpiMetric } from '../../types/dashboard';

interface KpiCardsProps {
  metrics: KpiMetric[];
}

const toneClasses: Record<KpiMetric['tone'], string> = {
  blue: 'from-blue-500/25 to-cyan-400/10 text-blue-300 shadow-blue-500/20',
  purple: 'from-purple-500/25 to-blue-500/10 text-purple-300 shadow-purple-500/20',
  green: 'from-emerald-500/25 to-teal-400/10 text-emerald-300 shadow-emerald-500/20',
  amber: 'from-amber-500/25 to-orange-400/10 text-amber-300 shadow-amber-500/20',
  cyan: 'from-cyan-500/25 to-blue-400/10 text-cyan-300 shadow-cyan-500/20',
};

export function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, index) => {
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;

        return (
          <motion.article
            key={metric.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.45, ease: 'easeOut' }}
            whileHover={{ y: -4, scale: 1.015 }}
            className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-[1px] shadow-2xl shadow-black/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/25 via-transparent to-purple-500/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative h-full rounded-[27px] bg-[#0F172A]/90 p-5 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-2xl', toneClasses[metric.tone])}>
                  <metric.icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                    metric.trend === 'up'
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border-red-400/20 bg-red-400/10 text-red-300',
                  )}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {metric.change}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-400">{metric.title}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">{metric.value}</p>
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}
