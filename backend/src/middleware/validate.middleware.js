const validate = (schema) => (req, res, next) => {
  const data = { ...req.body, ...req.params, ...req.query };
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((item) => ({ field: item.path.join('.'), message: item.message }));
    return res.status(400).json({ message: 'Dados inválidos', errors });
  }
  req.validated = result.data;
  next();
};

module.exports = validate;
