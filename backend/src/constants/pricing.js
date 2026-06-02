// Visitor pricing — full spec A (motor per-visit, car hourly + cap + overnight).
// Residents with an active subscription are charged 0 (covered by their package).

export const PRICING = {
  motorcycle: {
    mode: 'per_visit',
    perVisit: 5_000,            // 1 lượt (≤ 24h)
    overnightSurcharge: 5_000,  // /đêm chạm khung 22:00–06:00
    visitDurationHours: 24,     // quá 24h → cộng thêm 1 lượt
  },
  car: {
    mode: 'hourly',
    hourlyRate: 20_000,         // /giờ (round up)
    dailyCap: 120_000,          // /24h
    overnightSurcharge: 30_000, // /đêm
  },
};

export const OVERNIGHT_START_HOUR = 22; // 22:00
export const OVERNIGHT_END_HOUR = 6;    // 06:00

export const getPricingFor = (vehicleType) => PRICING[vehicleType];
