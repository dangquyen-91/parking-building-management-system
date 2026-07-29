import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Edit3,
  History,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Motorbike,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Shield,
  SquareParking,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import {
  profileService,
  type MySubscription,
  type MyVehicle,
} from '../services/profile.service';
import type { UserProfile } from '../services/auth.service';
import { authService } from '../services/auth.service';
import {
  getLicensePlateError,
  isLicensePlateValid,
  normalizeLicensePlate,
} from '../utils/license-plate';

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

const formatCurrency = (v: string | number) =>
  Number(v).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Đang hiệu lực', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Chờ xử lý', cls: 'bg-amber-100  text-amber-700  border-amber-200' },
  expired: { label: 'Hết hạn', cls: 'bg-slate-100  text-slate-500  border-slate-200' },
  cancelled: { label: 'Đã hủy', cls: 'bg-red-100    text-red-600    border-red-200' },
  renewed: { label: 'Đã cộng dồn', cls: 'bg-blue-100   text-blue-700   border-blue-200' },
};

const TABS = [
  { id: 'info', icon: User, label: 'Thông tin cá nhân' },
  { id: 'vehicles', icon: Car, label: 'Xe của tôi' },
  { id: 'packages', icon: Package, label: 'Gói tháng' },
  { id: 'history', icon: History, label: 'Lịch sử' },
  { id: 'security', icon: Shield, label: 'Bảo mật' },
] as const;
type TabId = typeof TABS[number]['id'];

function InfoField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function SubscriptionCard({
  sub,
  activeSubscriptions = [],
}: {
  sub: MySubscription;
  activeSubscriptions?: MySubscription[];
}) {
  const renewedInto = sub.status === 'cancelled'
    ? activeSubscriptions.find((activeSub) =>
      activeSub.id !== sub.id &&
      activeSub.licensePlate === sub.licensePlate &&
      activeSub.vehicleType === sub.vehicleType
    )
    : null;
  const displayStatus = renewedInto ? SUB_STATUS.renewed : SUB_STATUS[sub.status] ?? { label: sub.status, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  const isActive = sub.status === 'active';
  const VehicleIcon = sub.vehicleType === 'car' ? Car : Motorbike;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-[24px] border p-5 shadow-sm transition',
        isActive ? 'border-blue-200 bg-white shadow-blue-50' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            sub.vehicleType === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
          )}>
            <VehicleIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black tracking-widest text-slate-950">{sub.licensePlate}</h3>
              <span className={cn('rounded-full border px-3 py-0.5 text-xs font-bold', displayStatus.cls)}>
                {displayStatus.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {sub.package?.name ?? `Gói #${sub.packageId}`}
              {sub.slot ? ` · Ô ${sub.slot.slotCode}` : ''}
            </p>
            {renewedInto && (
              <p className="mt-1 text-xs font-semibold text-blue-600">
                Giao dịch này đã được cộng vào gói đang hiệu lực, hạn mới {formatDate(renewedInto.endDate)}.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <p className="text-lg font-black text-slate-950">{formatCurrency(sub.amount)}</p>
          <p className="text-xs text-slate-400">{sub.package?.durationDays ?? 30} ngày</p>
        </div>
      </div>

      <div className={`mt-5 grid gap-3 ${sub.vehicleType === 'car' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {[
          { icon: Calendar, label: 'Bắt đầu', value: renewedInto ? formatDate(renewedInto.startDate) : formatDate(sub.startDate) },
          { icon: Clock, label: 'Kết thúc', value: renewedInto ? formatDate(renewedInto.endDate) : formatDate(sub.endDate) },
          ...(sub.vehicleType === 'car'
            ? [{
              icon: SquareParking,
              label: 'Ô đỗ xe',
              value: sub.slot?.slotCode
                ? `Ô ${sub.slot.slotCode}`
                : sub.status === 'pending'
                  ? 'Đang xử lý'
                  : '—',
            }]
            : []),
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Icon className="mb-2 h-5 w-5 text-blue-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
  deletingId,
}: {
  vehicle: MyVehicle;
  onEdit: (v: MyVehicle) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}) {
  const isCar = vehicle.vehicleType === 'car';
  const VehicleIcon = isCar ? Car : Motorbike;
  const isDeleting = deletingId === vehicle.id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
        isCar ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
      )}>
        <VehicleIcon className="h-6 w-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-black tracking-widest text-slate-950">{vehicle.licensePlate}</p>
          <span className={cn(
            'rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
            isCar
              ? 'border-blue-200 bg-blue-50 text-blue-600'
              : 'border-amber-200 bg-amber-50 text-amber-600',
          )}>
            {isCar ? 'Ô tô' : 'Xe máy'}
          </span>
        </div>
        {vehicle.nickname ? (
          <p className="mt-0.5 text-sm text-slate-500 truncate">📌 {vehicle.nickname}</p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-400">Chưa đặt tên</p>
        )}
        <p className="mt-1 text-xs text-slate-400">Đã thêm {formatDate(vehicle.createdAt)}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => onEdit(vehicle)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:text-blue-600"
          title="Chỉnh sửa"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(vehicle.id)}
          disabled={isDeleting}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-300 hover:text-red-500 disabled:opacity-40"
          title="Xóa xe"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </motion.article>
  );
}

function VehicleModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: MyVehicle;
  onClose: () => void;
  onSaved: (v: MyVehicle) => void;
}) {
  const isEdit = !!initial;
  const [plate, setPlate] = useState(initial?.licensePlate ?? '');
  const [plateTouched, setPlateTouched] = useState(false);
  const [type, setType] = useState<'car' | 'motorcycle'>(initial?.vehicleType ?? 'car');
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedPlate = normalizeLicensePlate(plate);
  const plateError = !isEdit && plateTouched ? getLicensePlateError(plate) : null;

  const handleSave = async () => {
    if (!isEdit) {
      setPlateTouched(true);
      const validationError = getLicensePlateError(plate);
      if (validationError) {
        setError(null);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const result = isEdit
        ? await profileService.updateVehicle(initial!.id, {
          vehicleType: type,
          nickname: nickname.trim() || undefined,
        })
        : await profileService.addVehicle({
          licensePlate: normalizedPlate,
          vehicleType: type,
          nickname: nickname.trim() || undefined,
        });
      onSaved(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">
            {isEdit ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
              Biển số xe <span className="text-red-400">*</span>
            </label>
            <input
              value={plate}
              onChange={(event) => {
                setPlate(normalizeLicensePlate(event.target.value));
                setError(null);
              }}
              onBlur={() => setPlateTouched(true)}
              className={cn(
                'w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-900 outline-none transition focus:ring-2',
                plateError
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100',
              )}
              placeholder="30A-12345"
              maxLength={20}
              aria-invalid={Boolean(plateError)}
              disabled={isEdit}
            />
            {plateError && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{plateError}</span>
              </p>
            )}
            {isEdit && (
              <p className="mt-1 text-xs text-slate-400">Không thể thay đổi biển số sau khi đăng ký.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
              Loại xe
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['car', 'motorcycle'] as const).map(vt => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setType(vt)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition',
                    type === vt
                      ? vt === 'car'
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-amber-400 bg-amber-50 text-amber-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  {vt === 'car' ? <Car className="h-4 w-4" /> : <Motorbike className="h-4 w-4" />}
                  {vt === 'car' ? 'Ô tô' : 'Xe máy'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
              Tên gọi <span className="text-slate-400 font-normal normal-case">(tuỳ chọn)</span>
            </label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Xe đi làm, xe gia đình…"
            />
          </div>
        </div>

        {error && <div className="mt-4"><ErrorAlert message={error} /></div>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!isEdit && !isLicensePlateValid(plate))}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Lưu thay đổi' : 'Thêm xe'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChangePasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!currentPassword.trim()) { setError('Vui lòng nhập mật khẩu hiện tại.'); return; }
    if (newPassword.length < 8) { setError('Mật khẩu mới phải có ít nhất 8 ký tự.'); return; }
    if (!/[A-Z]/.test(newPassword)) { setError('Mật khẩu mới phải chứa ít nhất 1 chữ in hoa.'); return; }
    if (!/[0-9]/.test(newPassword)) { setError('Mật khẩu mới phải chứa ít nhất 1 chữ số.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }

    setSaving(true);
    setError(null);
    try {
      const tokens = await authService.changePassword({ currentPassword, newPassword, confirmPassword });
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Đổi mật khẩu</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-bold text-slate-900">Đổi mật khẩu thành công!</p>
            <p className="text-sm text-slate-500">Phiên đăng nhập đã được cập nhật.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
                Mật khẩu hiện tại <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
                Mật khẩu mới <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Ít nhất 8 ký tự, 1 chữ in hoa, 1 chữ số.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="mt-1"><ErrorAlert message={error} /></div>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Cập nhật
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await profileService.updateMe({ fullName: fullName.trim(), phone: phone.trim() });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Cập nhật hồ sơ</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
              Họ và tên
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
              Số điện thoại
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="0901234567"
              type="tel"
            />
          </div>
        </div>

        {error && <div className="mt-4"><ErrorAlert message={error} /></div>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser, isAuthenticated, loading: authLoading, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<MyVehicle[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<MySubscription[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<MySubscription[]>([]);

  const [tab, setTab] = useState<TabId>(() => {
    const tabParam = searchParams.get('tab') as TabId;
    return tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'info';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [vehicleModal, setVehicleModal] = useState<{ open: boolean; vehicle?: MyVehicle }>({ open: false });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [me, myVehicles, activeSubs, allSubs] = await Promise.all([
        profileService.getMe(),
        profileService.getMyVehicles(),
        profileService.getMySubscriptions('active'),
        profileService.getMySubscriptions(),
      ]);
      setProfile(me);
      setVehicles(myVehicles);
      setActiveSubscriptions(activeSubs);
      setAllSubscriptions(allSubs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleDeleteVehicle = async (id: number) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await profileService.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Không thể xóa xe.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleVehicleSaved = (saved: MyVehicle) => {
    setVehicles(prev => {
      const exists = prev.find(v => v.id === saved.id);
      return exists ? prev.map(v => v.id === saved.id ? saved : v) : [saved, ...prev];
    });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8fbff]">
        <div className="h-10 w-10 rounded-full border-2 border-blue-400/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  const displayProfile = profile ?? authUser;
  const initials = displayProfile?.fullName
    ?.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase() ?? '??';



  return (
    <>
      <div className="min-h-screen bg-[#f8fbff] pt-28 pb-20 text-slate-950">
        <main className="container mx-auto px-6 md:px-12">

          <section className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="relative shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-black text-white shadow-[0_8px_30px_rgba(37,99,235,0.35)]">
                  {initials}
                </div>
                {activeSubscriptions.length > 0 && (
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </span>
                )}
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Hồ sơ cá nhân</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  {displayProfile?.fullName ?? '—'}
                </h1>
                <p className="mt-1 text-slate-500">{displayProfile?.email}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {vehicles.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      <Car className="h-3 w-3" /> {vehicles.length} xe đã đăng ký
                    </span>
                  )}
                  {activeSubscriptions.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <Zap className="h-3 w-3" /> {activeSubscriptions.length} gói đang hiệu lực
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Chưa có gói tháng
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-auto hidden sm:flex items-center gap-3">
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
                >
                  <Edit3 className="h-4 w-4" /> Chỉnh sửa
                </button>
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-3 sm:hidden">
              <button
                onClick={() => setEditProfileOpen(true)}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm"
              >
                <Edit3 className="h-4 w-4" /> Chỉnh sửa hồ sơ
              </button>
            </div>
          </section>

          <section className="mx-auto mt-10 max-w-4xl">
            <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm overflow-x-auto">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex flex-1 min-w-fit items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap',
                    tab === id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-5 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white py-20 text-sm font-semibold text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" /> Đang tải hồ sơ…
                </div>
              ) : (
                <>
                  {tab === 'info' && displayProfile && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-black text-slate-950">Thông tin cơ bản</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoField icon={User} label="Họ và tên" value={displayProfile.fullName} />
                          <InfoField icon={Mail} label="Email" value={displayProfile.email} />
                          <InfoField icon={Phone} label="Số điện thoại" value={displayProfile.phone ?? 'Chưa cập nhật'} />
                          <InfoField icon={CheckCircle2} label="Trạng thái" value={displayProfile.isActive ? 'Đang hoạt động' : 'Bị khóa'} />
                        </div>
                        <p className="mt-4 text-xs text-slate-400">
                          Thành viên từ {formatDate(displayProfile.createdAt)} · Cập nhật lần cuối {formatDate(displayProfile.updatedAt)}
                        </p>
                      </div>
                    </motion.div>

                  )}

                  {tab === 'vehicles' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{vehicles.length} xe đã đăng ký</p>
                        </div>
                        <button
                          onClick={() => setVehicleModal({ open: true })}
                          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                        >
                          <Plus className="h-4 w-4" /> Thêm xe
                        </button>
                      </div>

                      {deleteError && <ErrorAlert message={deleteError} />}

                      {vehicles.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                          <Car className="mx-auto mb-4 h-10 w-10 text-blue-400" />
                          <h2 className="text-2xl font-black text-slate-950">Chưa có xe nào</h2>
                          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            Đăng ký xe để lưu biển số và dễ dàng check-in bãi đỗ. Mỗi biển số là duy nhất trên hệ thống.
                          </p>
                          <button
                            onClick={() => setVehicleModal({ open: true })}
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500"
                          >
                            <Plus className="h-4 w-4" /> Thêm xe ngay
                          </button>
                        </div>
                      ) : (
                        <AnimatePresence>
                          {vehicles.map(v => (
                            <VehicleCard
                              key={v.id}
                              vehicle={v}
                              onEdit={vehicle => setVehicleModal({ open: true, vehicle })}
                              onDelete={handleDeleteVehicle}
                              deletingId={deletingId}
                            />
                          ))}
                        </AnimatePresence>
                      )}
                    </motion.div>
                  )}

                  {tab === 'packages' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                      {activeSubscriptions.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                          <Package className="mx-auto mb-4 h-10 w-10 text-blue-600" />
                          <h2 className="text-2xl font-black text-slate-950">Chưa có gói tháng nào</h2>
                          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            Mua gói tháng để gửi xe với ưu đãi và được cấp ô đỗ cố định.
                          </p>
                          <Link
                            to="/membership"
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500"
                          >
                            Xem gói tháng
                          </Link>
                        </div>
                      ) : (
                        activeSubscriptions.map(sub => <SubscriptionCard key={sub.id} sub={sub} />)
                      )}
                    </motion.div>
                  )}

                  {tab === 'history' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {allSubscriptions.length === 0 ? (
                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                          <History className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                          <p className="text-lg font-bold text-slate-700">Chưa có lịch sử gói nào</p>
                        </div>
                      ) : (
                        allSubscriptions.map(sub => (
                          <SubscriptionCard key={sub.id} sub={sub} activeSubscriptions={activeSubscriptions} />
                        ))
                      )}
                    </motion.div>
                  )}

                  {tab === 'security' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-2 text-lg font-black text-slate-950">Bảo mật tài khoản</h2>
                        <p className="mb-6 text-sm text-slate-500">Quản lý mật khẩu và bảo mật phiên đăng nhập của bạn.</p>
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Mật khẩu</p>
                              <p className="text-xs text-slate-400">Đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setChangePasswordOpen(true)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Đổi mật khẩu
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {editProfileOpen && displayProfile && (
          <EditProfileModal
            profile={displayProfile as UserProfile}
            onClose={() => setEditProfileOpen(false)}
            onSaved={updated => {
              setProfile(updated);
              updateUser(updated);
            }}
          />
        )}
        {vehicleModal.open && (
          <VehicleModal
            initial={vehicleModal.vehicle}
            onClose={() => setVehicleModal({ open: false })}
            onSaved={handleVehicleSaved}
          />
        )}
        {changePasswordOpen && (
          <ChangePasswordModal
            onClose={() => setChangePasswordOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
