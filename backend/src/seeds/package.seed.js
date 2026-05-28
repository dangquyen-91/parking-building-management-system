import 'dotenv/config';
import { sequelize } from '../config/database.js';
import '../models/index.js';
import ParkingPackage from '../models/parking-package.model.js';

const PACKAGES = [
  { name: 'Xe máy hàng tháng', vehicleType: 'motorcycle', durationDays: 30, price: 150000, description: 'Gửi xe máy 1 tháng' },
  { name: 'Xe máy hàng quý', vehicleType: 'motorcycle', durationDays: 90, price: 400000, description: 'Gửi xe máy 3 tháng (tiết kiệm 50k)' },
  { name: 'Ô tô hàng tháng', vehicleType: 'car', durationDays: 30, price: 1500000, description: 'Gửi ô tô 1 tháng' },
  { name: 'Ô tô hàng quý', vehicleType: 'car', durationDays: 90, price: 4000000, description: 'Gửi ô tô 3 tháng (tiết kiệm 500k)' },
];

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const p of PACKAGES) {
    const [pkg, created] = await ParkingPackage.findOrCreate({
      where: { name: p.name },
      defaults: p,
    });
    if (!created) {
      await pkg.update(p);
    }
    console.log(`${created ? 'Created' : 'Updated'}: ${p.name} — ${p.price.toLocaleString('vi-VN')}đ / ${p.durationDays}d`);
  }

  console.log('Package seed done.');
  await sequelize.close();
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
