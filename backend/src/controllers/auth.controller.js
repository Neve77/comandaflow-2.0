const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const result = await authService.login(email, password);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
