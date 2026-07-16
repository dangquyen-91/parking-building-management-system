import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { bookingService } from '../services/booking.service';
import { profileService } from '../services/profile.service';

export interface BookingFormValues {
  licensePlate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  startTime: string;
  durationHours: number;
  note: string;
}

export const BOOKING_BLOCK_HOURS = 4;
export const BOOKING_BLOCK_PRICE = 35_000;
export const BOOKING_MAX_BLOCKS = 6;
export const BOOKING_DURATION_OPTIONS = Array.from(
  { length: BOOKING_MAX_BLOCKS },
  (_, i) => (i + 1) * BOOKING_BLOCK_HOURS
);

const platePattern = /^[A-Z0-9-]{4,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pad = (value: number) => String(value).padStart(2, '0');

function createDefaultWindow() {
  const format = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  return { startTime: format(start) };
}

export const normalizePlate = (value: string) => value.toUpperCase().replace(/\s/g, '').trim();

export function useBookingForm() {
  const { isAuthenticated, user } = useAuth();
  const [values, setValues] = useState<BookingFormValues>(() => {
    const defaultWindow = createDefaultWindow();
    return {
      licensePlate: '', customerName: user?.fullName ?? '', customerPhone: user?.phone ?? '',
      customerEmail: user?.email ?? '', startTime: defaultWindow.startTime, durationHours: BOOKING_BLOCK_HOURS, note: '',
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [previewHours, setPreviewHours] = useState<number | null>(null);
  const [ownPlates, setOwnPlates] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    profileService.getMySubscriptions('active').then((subscriptions) => {
      if (!cancelled) setOwnPlates(subscriptions.map((item) => normalizePlate(item.licensePlate)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    const timeoutId = window.setTimeout(() => setValues((current) => ({
      ...current,
      customerName: current.customerName || user.fullName || '',
      customerPhone: current.customerPhone || user.phone || '',
      customerEmail: current.customerEmail || user.email || '',
    })), 0);
    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const plate = normalizePlate(values.licensePlate);
  const plateValid = platePattern.test(plate);
  const emailValid = emailPattern.test(values.customerEmail.trim());
  const phoneValid = !values.customerPhone.trim() || /^\d{9,15}$/.test(values.customerPhone.trim());
  const durationHours = values.durationHours;
  const estimatedAmount = (durationHours / BOOKING_BLOCK_HOURS) * BOOKING_BLOCK_PRICE;
  const ready = plateValid && emailValid && phoneValid && !submitting;

  const updateField = <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  };

  const submit = async () => {
    if (!plateValid) return setSubmitError('Biển số chỉ gồm chữ, số, dấu gạch ngang và dài 4-20 ký tự.');
    if (!phoneValid) return setSubmitError('Số điện thoại phải có 9-15 chữ số.');
    if (!emailValid) return setSubmitError('Email không hợp lệ. Vui lòng nhập email cá nhân để nhận xác nhận booking.');
    if (ownPlates.includes(plate)) return setSubmitError('Biển số này đã có gói cư dân đang hoạt động, bạn không cần đặt chỗ vãng lai.');

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await bookingService.createBooking({
        licensePlate: plate,
        customerEmail: values.customerEmail.trim().toLowerCase(),
        startTime: new Date(values.startTime).toISOString(),
        durationHours: values.durationHours,
        customerName: values.customerName.trim() || undefined,
        customerPhone: values.customerPhone.trim() || undefined,
        note: values.note.trim() || undefined,
      });
      setPreviewAmount(result.amount);
      setPreviewHours(result.prepaidHours);
      window.location.href = result.paymentUrl;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể tạo đặt chỗ.');
      setSubmitting(false);
    }
  };

  return { values, updateField, isAuthenticated, ownPlates, plate, plateValid, emailValid, phoneValid,
    durationHours, estimatedAmount, ready, submitting, submitError, previewAmount, previewHours, submit };
}
