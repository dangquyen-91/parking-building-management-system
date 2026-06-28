import { Sequelize } from 'sequelize';

const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE;
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD;
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || 3306;

if (!databaseUrl && (!dbName || !dbUser || !dbPassword || !dbHost)) {
  throw new Error(
    'Missing database config. Set DATABASE_URL to Railway MYSQL_PUBLIC_URL locally, or MYSQL_URL when deployed on Railway.'
  );
}

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sequelizeOptions)
  : new Sequelize(
      dbName,
      dbUser,
      dbPassword,
      {
        ...sequelizeOptions,
        host: dbHost,
        port: dbPort,
      }
    );

const runMigrations = async () => {
  const migrations = [
    `ALTER TABLE users ADD COLUMN isEmailVerified TINYINT(1) DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN emailVerificationToken VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN emailVerificationTokenExpires DATETIME DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN passwordResetToken VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN passwordResetTokenExpires DATETIME DEFAULT NULL`,
  ];
  for (const sql of migrations) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      if (err.original?.errno !== 1060) throw err; // 1060 = Duplicate column — bỏ qua
    }
  }
  console.log('Migrations applied');
};

const connectDB = async () => {
  await sequelize.authenticate();
  const target = databaseUrl ? new URL(databaseUrl).host : `${dbHost}:${dbPort}`;
  console.log(`MySQL connected → ${target}`);
  if (process.env.NODE_ENV !== 'production') {
    await sequelize.sync();
    console.log('Tables synced');
  }
  await runMigrations();
};

export { sequelize, connectDB };
