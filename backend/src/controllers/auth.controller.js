import * as authService from '../services/auth.service.js';
import response from '../utils/response.js';

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    response.success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const tokens = await authService.login(req.body);
    response.success(res, tokens);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    response.success(res, tokens);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    response.message(res, 'Logged out');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const tokens = await authService.changePassword(req.user.id, req.body);
    response.success(res, tokens);
  } catch (err) {
    next(err);
  }
};

export { register, login, refresh, logout, changePassword };
