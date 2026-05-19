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

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('MySQL connected');
  await sequelize.sync({ alter: true });
  console.log('Tables synced');
};

export { sequelize, connectDB };
