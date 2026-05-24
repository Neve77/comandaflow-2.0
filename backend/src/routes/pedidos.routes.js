const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const pedidosController = require('../controllers/pedidos.controller');

const router = express.Router();

const createSchema = z.object({
  comandaId: z.string().uuid(),
  produtoId: z.string().uuid().optional(),
  nome: z.string().min(1),
  quantidade: z.string().transform((value) => parseInt(value, 10)).refine((value) => value > 0),
  valorUnitario: z.string().transform((value) => parseFloat(value)).refine((value) => value > 0)
});

const cancelSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);
router.post('/', validate(createSchema), pedidosController.create);
router.patch('/:id/cancel', validate(cancelSchema), pedidosController.cancel);

module.exports = router;
