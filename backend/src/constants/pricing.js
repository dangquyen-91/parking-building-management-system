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
    mode: 'hourly',
    hourPrice: 20_000,        // giá mỗi giờ ban ngày
    nightSurcharge: 10_000,   // phụ thu MỖI GIỜ trong khung đêm
    nightStart: 22,           // khung đêm bắt đầu 22:00
    nightEnd: 5,              // khung đêm kết thúc 05:00 (22:00–05:00)
    maxHours: 24,             // thời lượng đặt trước tối đa (giờ)
  },
};

export const getPricingFor = (vehicleType) => PRICING[vehicleType];
