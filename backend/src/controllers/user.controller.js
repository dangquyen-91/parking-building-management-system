const userService = require('../services/user.service');
const response = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAll();
    response.success(res, users);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    response.success(res, user);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    response.message(res, 'User deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, update, remove };
