import * as parkingSessionService from '../services/parking-session.service.js';
import response from '../utils/response.js';

const checkIn = async (req, res, next) => {
  try {
    const session = await parkingSessionService.checkIn(req.body, req.user.id);
    response.success(res, session, 201);
  } catch (err) {
    next(err);
  }
};

const getActiveSessions = async (req, res, next) => {
  try {
    const result = await parkingSessionService.getActiveSessions(req.query);
    response.paginated(res, result.sessions, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const session = await parkingSessionService.getById(req.params.id);
    response.success(res, session);
  } catch (err) {
    next(err);
  }
};

const lookup = async (req, res, next) => {
  try {
    const result = await parkingSessionService.lookup(req.query.licensePlate);
    response.success(res, result);
  } catch (err) {
    next(err);
  }
};

export { checkIn, getActiveSessions, getOne, lookup };
