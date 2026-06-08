import { PRICING, OVERNIGHT_START_HOUR, OVERNIGHT_END_HOUR } from '../constants/pricing.js';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export const countOvernightCrossings = (entryTime, exitTime) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  if (exit <= entry) return 0;

  let count = 0;
  const cursor = new Date(entry);
  cursor.setHours(OVERNIGHT_START_HOUR, 0, 0, 0);
  if (entry.getHours() < OVERNIGHT_START_HOUR) {
    /* cursor already at today 22:00 */
  }

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

export const calculateFee = (entryTime, exitTime, vehicleType) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const durationMs = Math.max(0, exit - entry);
  const durationMinutes = Math.round(durationMs / 60000);

  const cfg = PRICING[vehicleType];
  if (!cfg) {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: 'unknown', durationMinutes };
  }

  const overnightNights = countOvernightCrossings(entry, exit);
  const overnightFee = overnightNights * cfg.overnightSurcharge;

  let baseFee = 0;
  if (cfg.mode === 'per_visit') {
    const visitMs = cfg.visitDurationHours * HOUR_MS;
    const visits = Math.max(1, Math.ceil(durationMs / visitMs));
    baseFee = visits * cfg.perVisit;
  } else if (cfg.mode === 'hourly') {
    const fullDays = Math.floor(durationMs / DAY_MS);
    const leftoverMs = durationMs - fullDays * DAY_MS;
    const leftoverHours = Math.ceil(leftoverMs / HOUR_MS);
    baseFee = fullDays * cfg.dailyCap + Math.min(leftoverHours * cfg.hourlyRate, cfg.dailyCap);
  }

  return {
    baseFee,
    overnightFee,
    totalFee: baseFee + overnightFee,
    mode: cfg.mode,
    durationMinutes,
    overnightNights,
  };
};

export const calculateExcessFee = (entryTime, exitTime, vehicleType, prepaidHours) => {
  const prepaidEnd = new Date(entryTime);
  prepaidEnd.setHours(prepaidEnd.getHours() + (prepaidHours || 0));
  if (new Date(exitTime) <= prepaidEnd) {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: 'covered', durationMinutes: 0, overnightNights: 0 };
  }
  return calculateFee(prepaidEnd, exitTime, vehicleType);
};
