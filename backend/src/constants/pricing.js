export const PRICING = {
  motorcycle: {
    mode: 'tier_day_night',
    dayRate: 5_000,
    nightRate: 10_000,
    nightSurcharge: 5_000,
    dailyFee: 15_000,
  },
  car: {
    mode: 'hourly',
    hourlyRate: 20_000,
    dailyCap: 120_000,
    overnightSurcharge: 30_000,
  },
};

export const KHUNG1_START_HOUR = 6;
export const KHUNG1_END_HOUR = 17;
export const NIGHT_SURCHARGE_START = 22;
export const NIGHT_SURCHARGE_END = 6;

export const OVERNIGHT_START_HOUR = 22;
export const OVERNIGHT_END_HOUR = 6;

export const getPricingFor = (vehicleType) => PRICING[vehicleType];
