import { verifyAccess } from '../utils/jwt.js';
import response from '../utils/response.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.error(res, 'No token provided', 401);
  }

  try {
    req.user = verifyAccess(authHeader.split(' ')[1]);
    next();
  } catch (err) {
    return response.error(res, err.message, 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return response.error(res, 'Access denied', 403);
    }
    next();
  };
};

const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  try {
    req.user = verifyAccess(authHeader.split(' ')[1]);
  } catch {
    req.user = null;
  }
  next();
};

export { authenticate, authorize, optionalAuthenticate };
