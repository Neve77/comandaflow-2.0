const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const reportsController = require('../controllers/reports.controller');

const router = express.Router();

const periodSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  category: z.string().optional()
});

router.use(authenticate);
router.get('/dashboard', reportsController.dashboard);
router.get('/sales', validate(periodSchema), reportsController.sales);
router.get('/products', validate(periodSchema), reportsController.topProducts);

module.exports = router;
