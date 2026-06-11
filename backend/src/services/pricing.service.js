import {
  PRICING,
  KHUNG1_START_HOUR,
  KHUNG1_END_HOUR,
  NIGHT_SURCHARGE_START,
  NIGHT_SURCHARGE_END,
  OVERNIGHT_START_HOUR,
  OVERNIGHT_END_HOUR,
} from '../constants/pricing.js';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

const overlapsDailyWindow = (entry, exit, startHour, endHour) => {
  if (exit <= entry) return false;

  let day = new Date(entry);
  day.setHours(0, 0, 0, 0);

  while (day < exit) {
    const winStart = new Date(day);
    winStart.setHours(startHour, 0, 0, 0);

    const winEnd = new Date(day);
    if (startHour >= endHour) {
      winEnd.setDate(winEnd.getDate() + 1);
    }
    winEnd.setHours(endHour, 0, 0, 0);

    if (entry < winEnd && exit > winStart) return true;
    day.setDate(day.getDate() + 1);
  }
  return false;
};

export const countOvernightCrossings = (entryTime, exitTime) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  if (exit <= entry) return 0;

  let count = 0;
  const cursor = new Date(entry);
  cursor.setHours(OVERNIGHT_START_HOUR, 0, 0, 0);

  while (cursor < exit) {
    const nightStart = new Date(cursor);
    const nightEnd = new Date(cursor);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(OVERNIGHT_END_HOUR, 0, 0, 0);

    if (entry < nightEnd && exit > nightStart) count += 1;

    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

const calcMotorcycleFee = (entry, exit, cfg) => {
  const durationMs = exit - entry;

  if (durationMs >= DAY_MS) {
    const days = Math.ceil(durationMs / DAY_MS);
    return {
      baseFee: days * cfg.dailyFee,
      overnightFee: 0,
      detail: { mode: 'day_pass', days },
    };
  }

  const coversKhung1 = overlapsDailyWindow(entry, exit, KHUNG1_START_HOUR, KHUNG1_END_HOUR);
  const coversKhung2 = overlapsDailyWindow(entry, exit, KHUNG1_END_HOUR, KHUNG1_START_HOUR);

  let baseFee = 0;
  if (coversKhung1) baseFee += cfg.dayRate;
  if (coversKhung2) baseFee += cfg.nightRate;

  const touchesNight = overlapsDailyWindow(entry, exit, NIGHT_SURCHARGE_START, NIGHT_SURCHARGE_END);
  const overnightFee = touchesNight ? cfg.nightSurcharge : 0;

  return {
    baseFee,
    overnightFee,
    detail: { mode: 'tier', coversKhung1, coversKhung2, touchesNight },
  };
};

const calcCarFee = (entry, exit, cfg) => {
  const durationMs = exit - entry;
  const fullDays = Math.floor(durationMs / DAY_MS);
  const leftoverMs = durationMs - fullDays * DAY_MS;
  const leftoverHours = Math.ceil(leftoverMs / HOUR_MS);
  const baseFee = fullDays * cfg.dailyCap + Math.min(leftoverHours * cfg.hourlyRate, cfg.dailyCap);

  const overnightNights = countOvernightCrossings(entry, exit);
  const overnightFee = overnightNights * cfg.overnightSurcharge;

  return {
    baseFee,
    overnightFee,
    detail: { mode: 'hourly', fullDays, leftoverHours, overnightNights },
  };
};

export const calculateFee = (entryTime, exitTime, vehicleType) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const durationMs = Math.max(0, exit - entry);
  const durationMinutes = Math.round(durationMs / 60000);

  const cfg = PRICING[vehicleType];
  if (!cfg) {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: 'unknown', durationMinutes };
  }

  let result;
  if (cfg.mode === 'tier_day_night') {
    result = calcMotorcycleFee(entry, exit, cfg);
  } else if (cfg.mode === 'hourly') {
    result = calcCarFee(entry, exit, cfg);
  } else {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: cfg.mode, durationMinutes };
  }

  return {
    ...result,
    totalFee: result.baseFee + result.overnightFee,
    mode: cfg.mode,
    durationMinutes,
  };
};

export const calculateExcessFee = (entryTime, exitTime, vehicleType, prepaidHours) => {
  const prepaidEnd = new Date(entryTime);
  prepaidEnd.setHours(prepaidEnd.getHours() + (prepaidHours || 0));
  if (new Date(exitTime) <= prepaidEnd) {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: 'covered', durationMinutes: 0 };
  }
  return calculateFee(prepaidEnd, exitTime, vehicleType);
};
