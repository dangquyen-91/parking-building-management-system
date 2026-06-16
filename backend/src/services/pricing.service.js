import { PRICING } from '../constants/pricing.js';

const HOUR_MS = 3_600_000;

const countBlockCrossings = (entry, exit, startHour, endHour) => {
  if (exit <= entry) return 0;

  let count = 0;
  const cursor = new Date(entry);
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= exit) {
    const winStart = new Date(cursor);
    winStart.setHours(startHour, 0, 0, 0);

    const winEnd = new Date(cursor);
    if (startHour >= endHour) winEnd.setDate(winEnd.getDate() + 1);
    winEnd.setHours(endHour, 0, 0, 0);

    if (entry < winEnd && exit > winStart) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

const calcMotorcycleFee = (entry, exit, cfg) => {
  const breakdown = cfg.blocks.map((b) => {
    const crossings = countBlockCrossings(entry, exit, b.startHour, b.endHour);
    return {
      window: `${String(b.startHour).padStart(2, '0')}:00-${String(b.endHour).padStart(2, '0')}:00`,
      price: b.price,
      crossings,
      subtotal: crossings * b.price,
    };
  });
  const baseFee = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
  return { baseFee, overnightFee: 0, detail: { mode: 'time_block', blocks: breakdown } };
};

const calcCarFee = (entry, exit, cfg) => {
  const hours = (exit - entry) / HOUR_MS;
  const blocks = Math.max(1, Math.ceil(hours / cfg.blockHours));
  return {
    baseFee: blocks * cfg.blockPrice,
    overnightFee: 0,
    detail: { mode: 'fixed_block', blocks, blockHours: cfg.blockHours, hours: Math.ceil(hours) },
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
  if (cfg.mode === 'time_block') {
    result = calcMotorcycleFee(entry, exit, cfg);
  } else if (cfg.mode === 'fixed_block') {
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
