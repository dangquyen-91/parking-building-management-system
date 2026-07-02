import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as incidentController from '../controllers/incident.controller.js';
import { listIncidentsSchema } from '../validations/incident.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'manager', 'staff'),
  validate(listIncidentsSchema, 'query'),
  incidentController.getIncidents
);

export default router;
