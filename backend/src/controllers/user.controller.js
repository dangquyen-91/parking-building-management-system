import * as userService from '../services/user.service.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, role, isActive, search, sortBy, sortOrder } = req.query;
    const result = await userService.getAll({ page, limit, role, isActive, search, sortBy, sortOrder });
    response.paginated(res, result.users, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getById(req.user.id, req.user.id, req.user.role);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id, req.user.id, req.user.role);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body, req.user.id, req.user.role);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await userService.updateStatus(req.params.id, isActive);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return response.error(res, 'role is required', 400);
    const user = await userService.updateRole(req.params.id, role);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export { getAll, getMe, updateMe, getById, update, updateStatus, updateRole, remove };
