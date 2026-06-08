/**
 * Generic Joi validator. Validates `req.body` or `req.query` against `schema`
 * (4xx if invalid) then writes the coerced value back so the controller sees
 * Joi's transformed values (defaults, uppercased plates, etc.).
 *
 * NOTE on Express 5: `req.query` is now a GETTER ONLY — direct assignment
 * throws "Cannot set property query of #<IncomingMessage> which has only a
 * getter". We use Object.defineProperty to override it on the request object.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const target = source === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(target, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: messages });
    }
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req.body = value;
    }
    next();
  };
};

export default validate;
