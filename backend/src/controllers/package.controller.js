import * as packageService from '../services/package.service.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const packages = await packageService.getAll(req.query);
    response.success(res, packages);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const pkg = await packageService.getById(req.params.id);
    response.success(res, pkg);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const pkg = await packageService.create(req.body);
    response.success(res, pkg, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const pkg = await packageService.update(req.params.id, req.body);
    response.success(res, pkg);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await packageService.remove(req.params.id);
    response.message(res, 'Package disabled');
  } catch (err) {
    next(err);
  }
};

export { getAll, getById, create, update, remove };
