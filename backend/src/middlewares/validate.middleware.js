const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const target = source === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(target, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: messages });
    }
    if (source === 'query') {
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, value);
    } else {
      req.body = value;
    }
    next();
  };
};

export default validate;
