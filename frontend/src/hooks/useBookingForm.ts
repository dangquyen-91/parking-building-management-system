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

// Must match backend/src/constants/pricing.js (car: mode 'hourly')
export const CAR_HOUR_PRICE = 20_000;       // daytime rate per hour
export const CAR_NIGHT_SURCHARGE = 10_000;  // surcharge per night hour
export const CAR_NIGHT_START = 22;          // 22:00
export const CAR_NIGHT_END = 5;             // 05:00
export const BOOKING_MAX_HOURS = 24;
export const BOOKING_DURATION_OPTIONS = Array.from({ length: BOOKING_MAX_HOURS }, (_, i) => i + 1);

const isNightHour = (hour: number) =>
  CAR_NIGHT_START <= CAR_NIGHT_END
    ? hour >= CAR_NIGHT_START && hour < CAR_NIGHT_END
    : hour >= CAR_NIGHT_START || hour < CAR_NIGHT_END;

export const CAR_NIGHT_HOUR_PRICE = CAR_HOUR_PRICE + CAR_NIGHT_SURCHARGE; // total rate per night hour (includes surcharge)

export interface CarFeeBreakdown {
  hours: number;
  dayHours: number;
  nightHours: number;
  dayFee: number;
  nightFee: number;
  total: number;
}

/** Estimates car parking fee by hour + night surcharge — matches calcCarFeeHourly on the backend. */
export function carFeeBreakdown(startTime: string, durationHours: number): CarFeeBreakdown {
  const hours = Math.max(1, Math.ceil(durationHours || 0));
  let nightHours = 0;
  const cursor = new Date(startTime);
  if (!Number.isNaN(cursor.getTime())) {
    for (let i = 0; i < hours; i += 1) {
      if (isNightHour(cursor.getHours())) nightHours += 1;
      cursor.setHours(cursor.getHours() + 1);
    }
  }
  const dayHours = hours - nightHours;
  const dayFee = dayHours * CAR_HOUR_PRICE;
  const nightFee = nightHours * CAR_NIGHT_HOUR_PRICE;
  return { hours, dayHours, nightHours, dayFee, nightFee, total: dayFee + nightFee };
}

export function estimateCarFee(startTime: string, durationHours: number): number {
  return carFeeBreakdown(startTime, durationHours).total;
}

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
      customerEmail: user?.email ?? '', startTime: defaultWindow.startTime, durationHours: 2, note: '',
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
    }).catch(() => { });
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
  const feeBreakdown = carFeeBreakdown(values.startTime, durationHours);
  const estimatedAmount = feeBreakdown.total;
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

  return {
    values, updateField, isAuthenticated, ownPlates, plate, plateValid, emailValid, phoneValid,
    durationHours, estimatedAmount, feeBreakdown, ready, submitting, submitError, previewAmount, previewHours, submit
  };
}
