export const PRICING = {
  motorcycle: {
    mode: 'per_visit',
    perVisit: 5_000,
    overnightSurcharge: 5_000,
    visitDurationHours: 24,
  },
  car: {
    mode: 'hourly',
    hourlyRate: 20_000,
    dailyCap: 120_000,
    overnightSurcharge: 30_000,
  },
};

export const OVERNIGHT_START_HOUR = 22;
export const OVERNIGHT_END_HOUR = 6;

export const getPricingFor = (vehicleType) => PRICING[vehicleType];
