import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/database.js';
import swaggerSpec from './config/swagger.js';
import './models/index.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import buildingRoutes from './routes/building.routes.js';
import floorRoutes from './routes/floor.routes.js';
import parkingSlotRoutes from './routes/parking-slot.routes.js';
import parkingRowRoutes from './routes/parking-row.routes.js';
import parkingSessionRoutes from './routes/parking-session.routes.js';
import packageRoutes from './routes/package.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import reportRoutes from './routes/report.routes.js';
import errorHandler from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { expireBookings } from './services/booking.service.js';
import { expireSubscriptions } from './services/subscription.service.js';

const app = express();

app.set('trust proxy', 1);

connectDB().catch((err) => {
  console.error('Failed to connect to database', err.message);
  process.exit(1);
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/buildings', buildingRoutes);
app.use('/api/v1/floors', floorRoutes);
app.use('/api/v1/parking-slots', parkingSlotRoutes);
app.use('/api/v1/parking-rows', parkingRowRoutes);
app.use('/api/v1/parking-sessions', parkingSessionRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/reports', reportRoutes);

app.get('/health', (_req, res) =>
  res.json({ success: true, message: 'OK', data: { env: process.env.NODE_ENV } })
);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const runSweep = async () => {
  try {
    const [b, s] = await Promise.all([expireBookings(), expireSubscriptions()]);
    if (b.pendingCancelled || b.expired || s.pendingCancelled || s.activeExpired) {
      console.log('[sweep]', { booking: b, subscription: s });
    }
  } catch (err) {
    console.error('[sweep] failed:', err.message);
  }
};
const sweepTimer = setInterval(runSweep, SWEEP_INTERVAL_MS);
sweepTimer.unref();

export default app;
