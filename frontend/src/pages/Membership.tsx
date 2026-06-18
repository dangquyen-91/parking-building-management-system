import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Car,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Motorbike,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  SquareParking,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { packageService, type ParkingPackage } from '../services/package.service';
import { floorService } from '../services/floor.service';
import { getAvailableSlots } from '../services/kiosk.service';
import type { ParkingSlotApiItem } from '../types/kiosk';
import { subscriptionService, type ResidentSubscription } from '../services/subscription.service';

type VehicleTab = 'motorcycle' | 'car';

const formatCurrency = (value: string | number) =>
  Number(value)
    .toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
    .replace(/\s/g, '');

const normalizePlate = (value: string) => value.toUpperCase().replace(/\s/g, '').trim();
const platePattern = /^[A-Z0-9-]{4,20}$/;

const vehicleLabels: Record<VehicleTab, string> = {
  car: 'Ô tô',
  motorcycle: 'Xe máy',
};

function packageFeatures(pkg: ParkingPackage) {
  if (pkg.vehicleType === 'car') {
    return ['Giữ ô cư dân', 'Check-in cư dân', 'Checkout phí 0'];
  }

  return ['Gửi theo hàng cư dân', 'Check-in cư dân', 'Checkout phí 0'];
}

function sortPackages(items: ParkingPackage[]) {
  return [...items].sort((a, b) => a.durationDays - b.durationDays || Number(a.price) - Number(b.price));
}

function findDefaultPackage(items: ParkingPackage[]) {
  const sorted = sortPackages(items);
  return sorted.find((pkg) => pkg.durationDays > 30) ?? sorted[0] ?? null;
}

function getSavings(pkg: ParkingPackage, packages: ParkingPackage[]) {
  const monthly = packages.find((item) => item.vehicleType === pkg.vehicleType && item.durationDays <= 31);
  if (!monthly || pkg.durationDays <= monthly.durationDays) return 0;

  const cycles = Math.round(pkg.durationDays / monthly.durationDays);
  return Math.max(0, Number(monthly.price) * cycles - Number(pkg.price));
}

export default function Membership() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState<ParkingPackage[]>([]);
  const [residentSlots, setResidentSlots] = useState<ParkingSlotApiItem[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<ResidentSubscription[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTab>('motorcycle');
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotSearch, setSlotSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const visiblePackages = useMemo(
    () => sortPackages(packages.filter((item) => item.vehicleType === selectedVehicle)),
    [packages, selectedVehicle]
  );

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? null,
    [packages, selectedPackageId]
  );

  const plate = normalizePlate(licensePlate);
  const plateValid = platePattern.test(plate);
  const needsSlot = selectedPackage?.vehicleType === 'car';
  const selectedSlot = residentSlots.find((slot) => slot.id === selectedSlotId) ?? null;
  const filteredSlots = useMemo(() => {
    const keyword = slotSearch.trim().toUpperCase();
    if (!keyword) return residentSlots;
    return residentSlots.filter((slot) => {
      const slotCode = slot.slotCode.toUpperCase();
      const floorNumber = String(slot.floor?.floorNumber ?? '');
      const buildingName = slot.floor?.building?.name?.toUpperCase() ?? '';
      return slotCode.includes(keyword) || floorNumber.includes(keyword) || buildingName.includes(keyword);
    });
  }, [residentSlots, slotSearch]);
  const readyForPayment = Boolean(selectedPackage && plateValid && (!needsSlot || selectedSlotId));
  const activeSubCount = mySubscriptions.filter((sub) => sub.status === 'active').length;

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setError(null);

      try {
        if (!isAuthenticated) {
          if (!cancelled) {
            setPackages([]);
            setMySubscriptions([]);
            setSelectedPackageId(null);
          }
          return;
        }

        const packageResult = await packageService.getPackages({ isActive: true });
        if (cancelled) return;

        setPackages(packageResult);
        const firstVehicle = packageResult.some((pkg) => pkg.vehicleType === 'motorcycle') ? 'motorcycle' : 'car';
        const defaultPackage = findDefaultPackage(packageResult.filter((pkg) => pkg.vehicleType === firstVehicle));
        setSelectedVehicle(firstVehicle);
        setSelectedPackageId(defaultPackage?.id ?? null);

        try {
          const mine = await subscriptionService.getMine();
          if (!cancelled) setMySubscriptions(mine);
        } catch {
          if (!cancelled) setMySubscriptions([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được danh sách gói.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function loadResidentSlots() {
      if (selectedPackage?.vehicleType !== 'car' || !isAuthenticated) {
        setResidentSlots([]);
        setSelectedSlotId(null);
        setSlotModalOpen(false);
        setSlotSearch('');
        return;
      }

      setSlotsLoading(true);
      try {
        const floorResult = await floorService.getFloors({ vehicleType: 'car', floorType: 'resident', isActive: true, page: 1, limit: 100 });
        if (cancelled) return;

        const residentFloors = floorResult.floors.filter((floor) => floor.floorType === 'resident');
        const slotResults = await Promise.all(
          residentFloors.map((floor) => getAvailableSlots('car', { floorId: floor.id, limit: 100 }))
        );
        if (cancelled) return;

        const slots = slotResults.flatMap((result) => result.data);
        setResidentSlots(slots);
        setSelectedSlotId((current) => (current && slots.some((slot) => slot.id === current) ? current : null));
      } catch (err) {
        if (!cancelled) {
          setSubmitError(err instanceof Error ? err.message : 'Không tải được ô cư dân còn trống.');
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }

    loadResidentSlots();
    return () => {
      cancelled = true;
    };
  }, [selectedPackage?.vehicleType, isAuthenticated]);

  useEffect(() => {
    if (!slotModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSlotModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [slotModalOpen]);

  const handleVehicleChange = (vehicle: VehicleTab) => {
    setSelectedVehicle(vehicle);
    setSubmitError(null);
    setSelectedSlotId(null);
    setSlotSearch('');
    setSlotModalOpen(false);

    const nextDefault = findDefaultPackage(packages.filter((pkg) => pkg.vehicleType === vehicle));
    setSelectedPackageId(nextDefault?.id ?? null);
  };

  const handleSelectPackage = (pkg: ParkingPackage) => {
    setSelectedPackageId(pkg.id);
    setSubmitError(null);
    setSelectedSlotId(null);
    setSlotSearch('');
    setSlotModalOpen(false);
  };

  const handleSlotSelect = (slotId: number) => {
    setSelectedSlotId(slotId);
    setSlotModalOpen(false);
    setSubmitError(null);
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedPackage) {
      setSubmitError('Vui lòng chọn một gói gửi xe.');
      return;
    }
    if (!plateValid) {
      setSubmitError('Biển số chỉ gồm chữ, số, dấu gạch ngang và dài 4-20 ký tự.');
      return;
    }
    if (needsSlot && !selectedSlotId) {
      setSubmitError('Gói ô tô cần chọn một ô cư dân còn trống.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await subscriptionService.buyPackage({
        packageId: selectedPackage.id,
        licensePlate: plate,
        slotId: selectedSlotId ?? undefined,
      });
      window.location.href = result.paymentUrl;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể tạo thanh toán mua gói.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { label: 'Chọn gói', done: Boolean(selectedPackage) },
    { label: 'Biển số', done: plateValid },
    { label: needsSlot ? 'Chọn ô' : 'Thanh toán', done: !needsSlot || Boolean(selectedSlotId) },
  ];

  return (
    <div className="min-h-screen bg-[#f8fbff] pt-28 text-slate-950">
      <main className="container mx-auto px-6 pb-20 md:px-12">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Gói thành viên</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Chọn gói cư dân phù hợp với xe của bạn
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-light leading-8 text-slate-600">
            Chọn loại xe, so sánh chu kỳ thanh toán, nhập biển số và hoàn tất qua VNPay.
          </p>
        </section>

        {error && (
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mx-auto mt-10 max-w-3xl rounded-[26px] border border-blue-200 bg-blue-50 px-6 py-5 text-center text-sm text-blue-900">
            Bạn cần đăng nhập để xem và mua gói thành viên.
            <Link to="/login" className="ml-2 font-bold underline">Đăng nhập</Link>
          </div>
        )}

        {isAuthenticated && activeSubCount > 0 && (
          <div className="mx-auto mt-8 flex max-w-6xl flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Bạn đang có <span className="font-bold">{activeSubCount} gói</span> đang hiệu lực.
            </p>
            <Link
              to="/profile"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-emerald-700 underline-offset-2 hover:underline"
            >
              Xem trong Hồ sơ →
            </Link>
          </div>
        )}

        {loading && isAuthenticated ? (
          <div className="mt-20 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            Đang tải gói thành viên
          </div>
        ) : isAuthenticated ? (
          <>
            <div className="mx-auto mb-5 mt-12 flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex w-full rounded-3xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-auto">
                  {([
                    { value: 'motorcycle' as const, label: 'Xe máy', icon: Motorbike },
                    { value: 'car' as const, label: 'Ô tô', icon: Car },
                  ]).map((item) => {
                    const active = selectedVehicle === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleVehicleChange(item.value)}
                        className={cn(
                          'relative flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition sm:flex-none',
                          active ? 'text-white' : 'text-slate-500 hover:text-slate-900'
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="membershipVehicleTab"
                            className="absolute inset-0 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <item.icon className="relative h-4 w-4" />
                        <span className="relative">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Đang hiển thị <span className="font-bold text-slate-950">{visiblePackages.length}</span> gói {vehicleLabels[selectedVehicle].toLowerCase()}
                </div>
            </div>

            <section className="mx-auto grid max-w-6xl items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div>
              {visiblePackages.length === 0 ? (
                <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  <SquareParking className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <h2 className="text-lg font-bold text-slate-700">
                    Chưa có gói cho {vehicleLabels[selectedVehicle].toLowerCase()}
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Hiện chưa có gói nào cho loại xe này. Vui lòng chọn loại xe khác hoặc quay lại sau.
                  </p>
                </div>
              ) : (
              <div className="grid justify-center gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,340px))]">
                {visiblePackages.map((pkg, index) => {
                  const selected = pkg.id === selectedPackageId;
                  const savings = getSavings(pkg, packages);
                  const Icon = pkg.vehicleType === 'car' ? Car : Motorbike;

                  return (
                    <motion.button
                      key={pkg.id}
                      type="button"
                      layout
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: index * 0.05 }}
                      onClick={() => handleSelectPackage(pkg)}
                      className={cn(
                        'group relative overflow-hidden rounded-[26px] border bg-white p-5 text-left shadow-[0_14px_30px_rgba(15,23,42,0.07)] transition',
                        selected
                          ? 'border-blue-500 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] ring-4 ring-blue-100'
                          : 'border-slate-200 hover:-translate-y-1 hover:border-blue-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              {vehicleLabels[pkg.vehicleType]}
                            </span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {pkg.durationDays} ngày
                            </span>
                            {savings > 0 && (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                Tiết kiệm {formatCurrency(savings)}
                              </span>
                            )}
                          </div>
                          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-950">{pkg.name}</h2>
                          <p className="mt-2 min-h-[38px] text-sm font-light leading-6 text-slate-500">
                            {pkg.description || `Gói gửi xe cư dân dành cho ${vehicleLabels[pkg.vehicleType].toLowerCase()}.`}
                          </p>
                        </div>

                        <div className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition',
                          pkg.vehicleType === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
                          selected && 'scale-110'
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-5 flex items-end gap-2">
                        <span className="text-3xl font-black tracking-tight text-slate-950">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="mb-2 text-sm font-light text-slate-500">/{pkg.durationDays} ngày</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        ≈ {formatCurrency(Math.round(Number(pkg.price) / pkg.durationDays))}/ngày
                      </p>

                      <div className="mt-5 grid gap-2.5">
                        {packageFeatures(pkg).map((feature) => (
                          <div key={feature} className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                            {feature}
                          </div>
                        ))}
                      </div>

                      <div className={cn(
                        'mt-5 flex h-11 items-center justify-center rounded-2xl border text-sm font-bold transition',
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'border-slate-200 bg-slate-50 text-slate-900 group-hover:border-blue-300 group-hover:text-blue-600'
                      )}>
                        {selected ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Đã chọn
                          </>
                        ) : (
                          'Chọn gói'
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              )}
            </div>

            {selectedPackage && (
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.11)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Thanh toán</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">Hoàn tất đăng ký</h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <ReceiptText className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="relative grid grid-cols-3 gap-2">
                      <div className="absolute left-[16%] right-[16%] top-4 h-0.5 bg-slate-200" />
                      <div
                        className="absolute left-[16%] top-4 h-0.5 bg-blue-500 transition-all"
                        style={{ width: `${Math.max(0, steps.filter((step) => step.done).length - 1) * 34}%` }}
                      />
                      {steps.map((step, index) => (
                        <div
                          key={step.label}
                          className={cn(
                            'relative z-10 text-center text-[10px] font-bold transition',
                            step.done ? 'text-blue-700' : 'text-slate-400'
                          )}
                        >
                          <span className={cn(
                            'mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full border bg-white text-[10px] shadow-sm',
                            step.done ? 'border-blue-300 text-blue-700' : 'border-slate-200 text-slate-400'
                          )}>
                            {step.done ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
                          </span>
                          {step.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Biển số xe</span>
                      <input
                        value={licensePlate}
                        onChange={(event) => {
                          setLicensePlate(event.target.value.toUpperCase());
                          setSubmitError(null);
                        }}
                        placeholder="VD: 51A-12345"
                        className={cn(
                          'mt-2 h-11 w-full rounded-2xl border bg-slate-50 px-4 text-base font-bold tracking-widest text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white',
                          licensePlate && !plateValid ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'
                        )}
                      />
                      <span className={cn(
                        'mt-1.5 block text-xs',
                        licensePlate && !plateValid ? 'text-red-500' : 'text-slate-400'
                      )}>
                        Gồm chữ, số và dấu gạch ngang, dài 4–20 ký tự.
                      </span>
                    </label>

                    {needsSlot && (
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slate-700">Ô cư dân</span>
                          {slotsLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                        </div>

                        {residentSlots.length === 0 && !slotsLoading ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                            Chưa có ô cư dân trống. Vui lòng kiểm tra cấu hình tầng/slot hoặc chọn gói xe máy.
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                                <SquareParking className={cn('h-5 w-5', selectedSlot && 'text-emerald-500')} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  {selectedSlot ? 'Đã chọn' : 'Chưa chọn'}
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-slate-950">
                                  {selectedSlot ? selectedSlot.slotCode : `${residentSlots.length} ô trống`}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {selectedSlot
                                    ? `Tầng ${selectedSlot.floor?.floorNumber ?? '--'} · ${selectedSlot.floor?.building?.name ?? 'Resident'}`
                                    : 'Mở danh sách để chọn ô phù hợp'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSlotModalOpen(true)}
                                disabled={slotsLoading}
                                className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {selectedSlot ? 'Đổi ô' : 'Chọn'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Gói đã chọn</p>
                        <p className="mt-0.5 text-sm font-black text-slate-950">{selectedPackage.name}</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-blue-500" />
                    </div>

                    <div className="mt-2 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Biển số</span>
                        <span className="font-bold tracking-widest text-slate-950">{plate || '--'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Phương tiện</span>
                        <span className="font-bold text-slate-950">{vehicleLabels[selectedPackage.vehicleType]}</span>
                      </div>
                      {selectedSlot && (
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">Ô đỗ</span>
                          <span className="font-bold text-emerald-600">{selectedSlot.slotCode}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-3 border-t border-slate-200 pt-2">
                      <span className="text-sm font-semibold text-slate-500">Thành tiền</span>
                      <motion.span
                        key={selectedPackage.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-black text-blue-600"
                      >
                        {formatCurrency(selectedPackage.price)}
                      </motion.span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="mt-3 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleBuy}
                    disabled={submitting || loading || !readyForPayment}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {submitting ? 'Đang tạo giao dịch VNPay...' : 'Thanh toán qua VNPay'}
                  </button>
                </div>
              </aside>
            )}
          </section>
          </>
        ) : null}

      </main>

      {slotModalOpen && needsSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
          onClick={() => setSlotModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Ô cư dân</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Chọn ô cho gói ô tô</h2>
                <p className="mt-1 text-sm text-slate-500">{residentSlots.length} ô trống phù hợp</p>
              </div>
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-red-200 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-200 px-6 py-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={slotSearch}
                  onChange={(event) => setSlotSearch(event.target.value)}
                  placeholder="Tìm mã ô, tầng hoặc tòa nhà"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filteredSlots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  Không tìm thấy ô phù hợp.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSlots.map((slot) => {
                    const selected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSlotSelect(slot.id)}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition hover:-translate-y-0.5',
                          selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <SquareParking className={cn('h-5 w-5', selected ? 'text-emerald-600' : 'text-blue-600')} />
                            <span className="text-lg font-black">{slot.slotCode}</span>
                          </div>
                          {selected && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Tầng {slot.floor?.floorNumber ?? '--'} · {slot.floor?.building?.name ?? 'Resident'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
