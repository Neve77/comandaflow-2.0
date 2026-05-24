const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const braceletsController = require('../controllers/bracelets.controller');

const router = express.Router();

const createBraceletSchema = z.object({
  number: z.string().min(1)
});

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.string().refine((val) => ['livre', 'em_uso', 'bloqueada'].includes(val), {
    message: 'Status deve ser: livre, em_uso ou bloqueada'
  })
});

router.use(authenticate);
router.get('/', braceletsController.getAll);
router.post('/', validate(createBraceletSchema), braceletsController.create);
router.patch('/:id/status', validate(statusSchema), braceletsController.updateStatus);

module.exports = router;
