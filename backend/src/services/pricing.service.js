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

// Giờ (0–23) có nằm trong khung đêm không (khung có thể vắt qua nửa đêm, vd 22→5).
const isNightHour = (hour, nightStart, nightEnd) =>
  nightStart <= nightEnd
    ? hour >= nightStart && hour < nightEnd
    : hour >= nightStart || hour < nightEnd;

// Ô tô: tính THEO GIỜ, làm tròn lên và tối thiểu 1 giờ. Mỗi giờ nằm trong khung đêm
// (22:00–05:00) chịu thêm phụ thu. Phân loại ngày/đêm theo giờ bắt đầu của từng block 1 tiếng.
const calcCarFeeHourly = (entry, exit, cfg) => {
  const durationMs = Math.max(0, exit - entry);
  const hours = Math.max(1, Math.ceil(durationMs / HOUR_MS));

  let nightHours = 0;
  const cursor = new Date(entry);
  for (let i = 0; i < hours; i += 1) {
    if (isNightHour(cursor.getHours(), cfg.nightStart, cfg.nightEnd)) nightHours += 1;
    cursor.setHours(cursor.getHours() + 1);
  }

  return {
    baseFee: hours * cfg.hourPrice,               // toàn bộ giờ tính giá gốc
    overnightFee: nightHours * cfg.nightSurcharge, // cộng phụ thu cho giờ đêm
    detail: {
      mode: 'hourly',
      hours,
      dayHours: hours - nightHours,
      nightHours,
      hourPrice: cfg.hourPrice,
      nightSurcharge: cfg.nightSurcharge,
    },
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
  } else if (cfg.mode === 'hourly') {
    result = calcCarFeeHourly(entry, exit, cfg);
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
