import { Op } from 'sequelize';
import IncidentReport from '../models/incident-report.model.js';
import ParkingSession from '../models/parking-session.model.js';
import Floor from '../models/floor.model.js';
import User from '../models/user.model.js';

const baseInclude = [
  { model: ParkingSession, as: 'session', attributes: ['id', 'entryTime', 'exitTime', 'vehicleType'] },
  { model: Floor, as: 'floor', attributes: ['id', 'floorNumber'] },
  { model: User, as: 'staff', attributes: ['id', 'fullName'] },
];

export const getIncidents = async (filters = {}, requester) => {
  const where = {};
  if (filters.type) where.type = filters.type;
  if (filters.floorId) where.floorId = parseInt(filters.floorId);
  if (filters.licensePlate) where.licensePlate = filters.licensePlate.toUpperCase().replace(/\s/g, '');

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt[Op.gte] = new Date(filters.from);
    if (filters.to) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
  }

  // Staff chỉ xem báo cáo mình tạo; admin/manager xem tất cả.
  if (requester.role === 'staff') where.staffId = requester.id;

  const page = parseInt(filters.page) || 1;
  const limit = Math.min(100, parseInt(filters.limit) || 20);

  const { count, rows } = await IncidentReport.findAndCountAll({
    where,
    include: baseInclude,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    incidents: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};
