const success = (res, data, status = 200) => {
  return res.status(status).json({ success: true, data });
};

const paginated = (res, data, pagination) => {
  return res.status(200).json({ success: true, data, pagination });
};

const message = (res, msg, status = 200) => {
  return res.status(status).json({ success: true, message: msg });
};

const error = (res, msg, status = 500) => {
  return res.status(status).json({ success: false, message: msg });
};

export default { success, paginated, message, error };
