const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const auditController = require('../../controllers/audit.controller');

const router = express.Router();

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(500).default(100)
});

router.use(authenticate);
router.get('/', validate(querySchema), auditController.list);

module.exports = router;
