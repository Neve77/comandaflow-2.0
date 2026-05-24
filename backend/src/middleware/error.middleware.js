const errorMiddleware = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Erro interno no servidor';
  return res.status(status).json({ message });
};

module.exports = errorMiddleware;
