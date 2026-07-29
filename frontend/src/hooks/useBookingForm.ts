import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { bookingService } from "../services/booking.service";
import { profileService } from "../services/profile.service";
import {
  getLicensePlateError,
  normalizeLicensePlate,
} from "../utils/license-plate";

export interface BookingFormValues {
  licensePlate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  startTime: string;
  durationHours: number;
  note: string;
}

export type BookingFieldErrors = Partial<
  Record<keyof BookingFormValues, string>
>;

// Must match backend/src/constants/pricing.js (car: mode 'hourly')
export const CAR_HOUR_PRICE = 20_000; // daytime rate per hour
export const CAR_NIGHT_SURCHARGE = 10_000; // surcharge per night hour
export const CAR_NIGHT_START = 22; // 22:00
export const CAR_NIGHT_END = 5; // 05:00
export const BOOKING_MAX_HOURS = 24;
export const BOOKING_DURATION_OPTIONS = Array.from(
  { length: BOOKING_MAX_HOURS },
  (_, i) => i + 1,
);

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
export function carFeeBreakdown(
  startTime: string,
  durationHours: number,
): CarFeeBreakdown {
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
  return {
    hours,
    dayHours,
    nightHours,
    dayFee,
    nightFee,
    total: dayFee + nightFee,
  };
}

export function estimateCarFee(
  startTime: string,
  durationHours: number,
): number {
  return carFeeBreakdown(startTime, durationHours).total;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pad = (value: number) => String(value).padStart(2, "0");

function createDefaultWindow() {
  const format = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  return { startTime: format(start) };
}

function validateBookingValues(values: BookingFormValues): BookingFieldErrors {
  const errors: BookingFieldErrors = {};
  const plate = normalizeLicensePlate(values.licensePlate);
  const name = values.customerName.trim();
  const phone = values.customerPhone.trim();
  const email = values.customerEmail.trim();
  const note = values.note.trim();
  const start = new Date(values.startTime);
  const now = Date.now();

  const plateError = getLicensePlateError(plate);
  if (plateError) errors.licensePlate = plateError;

  if (name && name.length < 2)
    errors.customerName = "Tên khách hàng phải có ít nhất 2 ký tự.";
  else if (name.length > 100)
    errors.customerName = "Tên khách hàng không được vượt quá 100 ký tự.";

  if (phone && !/^\d{9,15}$/.test(phone))
    errors.customerPhone = "Số điện thoại phải có 9–15 chữ số.";

  if (!email)
    errors.customerEmail = "Vui lòng nhập email để nhận xác nhận booking.";
  else if (!emailPattern.test(email))
    errors.customerEmail = "Email không hợp lệ.";

  if (!values.startTime || Number.isNaN(start.getTime()))
    errors.startTime = "Vui lòng chọn thời gian bắt đầu hợp lệ.";
  else if (start.getTime() <= now)
    errors.startTime = "Thời gian bắt đầu phải ở tương lai.";
  else if (start.getTime() > now + 24 * 60 * 60 * 1000)
    errors.startTime = "Chỉ được đặt trước tối đa 24 giờ.";

  if (
    !Number.isInteger(values.durationHours) ||
    values.durationHours < 1 ||
    values.durationHours > BOOKING_MAX_HOURS
  ) {
    errors.durationHours = `Thời lượng đặt chỗ phải từ 1 đến ${BOOKING_MAX_HOURS} giờ.`;
  }

  if (note.length > 500) errors.note = "Ghi chú không được vượt quá 500 ký tự.";
  return errors;
}

export function useBookingForm() {
  const { isAuthenticated, user } = useAuth();
  const [values, setValues] = useState<BookingFormValues>(() => {
    const defaultWindow = createDefaultWindow();
    return {
      licensePlate: "",
      customerName: user?.fullName ?? "",
      customerPhone: user?.phone ?? "",
      customerEmail: user?.email ?? "",
      startTime: defaultWindow.startTime,
      durationHours: 2,
      note: "",
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [previewHours, setPreviewHours] = useState<number | null>(null);
  const [ownPlates, setOwnPlates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Awaited<ReturnType<typeof bookingService.getAvailability>> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadAvailability = async () => {
      try {
        const result = await bookingService.getAvailability();
        if (!cancelled) {
          setAvailability(result);
          setAvailabilityError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(
            error instanceof Error ? error.message : "Không tải được sức chứa bãi xe.",
          );
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };
    loadAvailability();
    const intervalId = window.setInterval(loadAvailability, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    profileService
      .getMySubscriptions("active")
      .then((subscriptions) => {
        if (!cancelled)
          setOwnPlates(
            subscriptions.map((item) =>
              normalizeLicensePlate(item.licensePlate),
            ),
          );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    const timeoutId = window.setTimeout(
      () =>
        setValues((current) => ({
          ...current,
          customerName: current.customerName || user.fullName || "",
          customerPhone: current.customerPhone || user.phone || "",
          customerEmail: current.customerEmail || user.email || "",
        })),
      0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const plate = normalizeLicensePlate(values.licensePlate);
  const fieldErrors = validateBookingValues(values);
  const plateValid = !fieldErrors.licensePlate;
  const emailValid = !fieldErrors.customerEmail;
  const phoneValid = !fieldErrors.customerPhone;
  const durationHours = values.durationHours;
  const feeBreakdown = carFeeBreakdown(values.startTime, durationHours);
  const estimatedAmount = feeBreakdown.total;
  const ready =
    Object.keys(fieldErrors).length === 0 &&
    !submitting &&
    !availabilityLoading &&
    availability?.acceptingBookings === true;

  const updateField = <K extends keyof BookingFormValues>(
    field: K,
    value: BookingFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  };

  const submit = async () => {
    if (!availability?.acceptingBookings) {
      return setSubmitError(
        availability
          ? `Bãi chỉ còn ${availability.available} chỗ trống, hệ thống tạm ngừng nhận booking.`
          : "Chưa kiểm tra được sức chứa bãi xe. Vui lòng thử lại.",
      );
    }
    const firstError = Object.values(fieldErrors)[0];
    if (firstError) return setSubmitError(firstError);
    if (ownPlates.includes(plate))
      return setSubmitError(
        "Biển số này đã có gói cư dân đang hoạt động, bạn không cần đặt chỗ vãng lai.",
      );

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
      setSubmitError(
        error instanceof Error ? error.message : "Không thể tạo đặt chỗ.",
      );
      setSubmitting(false);
    }
  };

  return {
    values,
    updateField,
    fieldErrors,
    isAuthenticated,
    ownPlates,
    plate,
    plateValid,
    emailValid,
    phoneValid,
    durationHours,
    estimatedAmount,
    feeBreakdown,
    ready,
    submitting,
    submitError,
    previewAmount,
    previewHours,
    availability,
    availabilityLoading,
    availabilityError,
    submit,
  };
}
