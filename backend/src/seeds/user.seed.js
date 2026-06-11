import 'dotenv/config';
import { sequelize } from '../config/database.js';
import '../models/index.js';
import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import { hashPassword } from '../utils/hash.js';

const USERS = [
  { fullName: 'Admin Test',   email: 'admin@test.com',   password: 'Admin1234',   role: 'admin',   phone: '0900000001' },
  { fullName: 'Manager Test', email: 'manager@test.com', password: 'Manager1234', role: 'manager', phone: '0900000002' },
  { fullName: 'Staff Test',   email: 'staff@test.com',   password: 'Staff1234',   role: 'staff',   phone: '0900000003' },
  { fullName: 'User Test',    email: 'user@test.com',    password: 'User1234',    role: 'user',    phone: '0900000004' },
];

const ROLE_DEFAULTS = [
  { name: 'admin',   description: 'Full system access' },
  { name: 'manager', description: 'Manage building operations + packages' },
  { name: 'staff',   description: 'Check-in/out + payment confirmation' },
  { name: 'user',    description: 'Customer / resident' },
];

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const r of ROLE_DEFAULTS) {
    await Role.findOrCreate({ where: { name: r.name }, defaults: r });
  }

  const roleMap = Object.fromEntries(
    (await Role.findAll()).map((r) => [r.name, r.id])
  );

  for (const u of USERS) {
    const roleId = roleMap[u.role];
    if (!roleId) throw new Error(`Role "${u.role}" not seeded`);

    const hashed = await hashPassword(u.password);
    const [user, created] = await User.findOrCreate({
      where: { email: u.email },
      defaults: {
        fullName: u.fullName,
        email: u.email,
        password: hashed,
        roleId,
        phone: u.phone,
      },
    });
    if (!created) {
      await user.update({
        fullName: u.fullName,
        roleId,
        phone: u.phone,
        password: hashed,
        isActive: true,
      });
    }
    console.log(`${created ? 'Created' : 'Updated'}: ${u.email} (${u.role}) — password: ${u.password}`);
  }

  console.log('User seed done.');
  await sequelize.close();
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
