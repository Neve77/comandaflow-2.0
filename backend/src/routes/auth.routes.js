const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
