import { PRICING, OVERNIGHT_START_HOUR, OVERNIGHT_END_HOUR } from '../constants/pricing.js';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Count how many distinct overnight crossings [22:00–06:00] a stay touches.
 *
 * We iterate day by day, marking a night if any minute of the 22:00→next-06:00
 * window overlaps [entry, exit]. A car entering at 21:00 and leaving at 07:00
 * counts as 1 overnight; staying 3 consecutive nights counts as 3.
 */
export const countOvernightCrossings = (entryTime, exitTime) => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  if (exit <= entry) return 0;

  let count = 0;
  // Start the scan at the night that begins on the same calendar day as entry.
  const cursor = new Date(entry);
  cursor.setHours(OVERNIGHT_START_HOUR, 0, 0, 0);
  // If entry is already after 22:00, the first night is the one we're in.
  if (entry.getHours() < OVERNIGHT_START_HOUR) {
    // cursor already at today 22:00
  }

  while (cursor < exit) {
    const nightStart = new Date(cursor);
    const nightEnd = new Date(cursor);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(OVERNIGHT_END_HOUR, 0, 0, 0);

    // Stay overlaps [nightStart, nightEnd]?
    if (entry < nightEnd && exit > nightStart) count += 1;

    cursor.setDate(cursor.getDate() + 1); // next day's 22:00
  }
  return count;
};

/**
 * Calculate the parking fee for a [entry, exit] window for visitor pricing.
 * Returns { baseFee, overnightFee, totalFee, mode, durationMinutes }.
 *
 * Motorcycle: per-visit (≤24h = 1 visit, then +1 visit per 24h chunk).
 * Car: hourly with daily cap; 24h chunks fully cap, leftover hours capped too.
 */
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

/**
 * For a session that was pre-paid for N hours (via booking), compute the
 * excess fee. Excess starts at entry + prepaidHours; if exit ≤ that, no charge.
 */
export const calculateExcessFee = (entryTime, exitTime, vehicleType, prepaidHours) => {
  const prepaidEnd = new Date(entryTime);
  prepaidEnd.setHours(prepaidEnd.getHours() + (prepaidHours || 0));
  if (new Date(exitTime) <= prepaidEnd) {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: 'covered', durationMinutes: 0, overnightNights: 0 };
  }
  return calculateFee(prepaidEnd, exitTime, vehicleType);
};
