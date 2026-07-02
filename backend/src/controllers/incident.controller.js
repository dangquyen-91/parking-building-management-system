import * as incidentService from '../services/incident.service.js';
import response from '../utils/response.js';

const getIncidents = async (req, res, next) => {
  try {
    const result = await incidentService.getIncidents(req.query, req.user);
    response.paginated(res, result.incidents, result.pagination);
  } catch (err) {
    next(err);
  }
};

export { getIncidents };
