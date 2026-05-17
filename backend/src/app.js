import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/database.js';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import errorHandler from './middlewares/error.middleware.js';
import response from './utils/response.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/health', (req, res) => {
  response.message(res, 'Server is running');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  });
};

start();
