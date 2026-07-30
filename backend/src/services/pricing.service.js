import { PRICING } from '../constants/pricing.js';

const HOUR_MS = 3_600_000;

// Bảng giá neo theo giờ Việt Nam (UTC+7, không có DST). getHours()/setHours() đọc theo
// timezone của process — server deploy chạy UTC nên sẽ lệch 7 tiếng và áp sai khung giá.
// Vì vậy mọi phép tính giờ trong file này đổi sang "đồng hồ VN" rồi dùng getUTC*/setUTC*.
const VN_OFFSET_MS = 7 * HOUR_MS;

// Instant thật → Date mà getUTC*/setUTC* đọc ra đúng giờ VN.
const toVNClock = (date) => new Date(new Date(date).getTime() + VN_OFFSET_MS);

// Giờ VN (0–23) của một instant.
const vnHour = (date) => toVNClock(date).getUTCHours();

const countBlockCrossings = (entry, exit, startHour, endHour) => {
  if (exit <= entry) return 0;

  // So sánh trên đồng hồ VN: entry/exit dịch cùng một lượng nên thứ tự và độ dài
  // khoảng thời gian không đổi.
  const entryVN = toVNClock(entry);
  const exitVN = toVNClock(exit);

  let count = 0;
  const cursor = new Date(entryVN);
  cursor.setUTCDate(cursor.getUTCDate() - 1);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= exitVN) {
    const winStart = new Date(cursor);
    winStart.setUTCHours(startHour, 0, 0, 0);

    const winEnd = new Date(cursor);
    if (startHour >= endHour) winEnd.setUTCDate(winEnd.getUTCDate() + 1);
    winEnd.setUTCHours(endHour, 0, 0, 0);

    if (entryVN < winEnd && exitVN > winStart) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
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

// Giờ VN (0–23) có nằm trong khung đêm không (khung có thể vắt qua nửa đêm, vd 22→5).
const isNightHour = (hour, nightStart, nightEnd) =>
  nightStart <= nightEnd
    ? hour >= nightStart && hour < nightEnd
    : hour >= nightStart || hour < nightEnd;

// Ô tô: tính THEO GIỜ, làm tròn lên và tối thiểu 1 giờ. Mỗi giờ nằm trong khung đêm
// (22:00–05:00 giờ VN) chịu thêm phụ thu. Phân loại ngày/đêm theo giờ VN bắt đầu của
// từng block 1 tiếng.
const calcCarFeeHourly = (entry, exit, cfg) => {
  const durationMs = Math.max(0, exit - entry);
  const hours = Math.max(1, Math.ceil(durationMs / HOUR_MS));

  let nightHours = 0;
  for (let i = 0; i < hours; i += 1) {
    const hour = vnHour(entry.getTime() + i * HOUR_MS);
    if (isNightHour(hour, cfg.nightStart, cfg.nightEnd)) nightHours += 1;
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
  const prepaidEnd = new Date(new Date(entryTime).getTime() + (prepaidHours || 0) * HOUR_MS);
  if (new Date(exitTime) <= prepaidEnd) {
    return { baseFee: 0, overnightFee: 0, totalFee: 0, mode: 'covered', durationMinutes: 0 };
  }
  return calculateFee(prepaidEnd, exitTime, vehicleType);
};
