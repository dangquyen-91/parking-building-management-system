export const PRICING = {
  motorcycle: {
    mode: 'time_block',
    blocks: [
      { startHour: 6, endHour: 17, price: 5_000 },
      { startHour: 17, endHour: 22, price: 10_000 },
      { startHour: 22, endHour: 6, price: 15_000 },
    ],
  },
  car: {
    mode: 'fixed_block',
    blockHours: 4,
    blockPrice: 35_000,
    maxBlocks: 6,
  },
};

export const getPricingFor = (vehicleType) => PRICING[vehicleType];
