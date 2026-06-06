const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const pedidosController = require('../../controllers/pedidos.controller');

const router = express.Router();

const createSchema = z.object({
  comandaId: z.string().uuid(),
  produtoId: z.string().uuid().optional(),
  nome: z.string().trim().optional(),
  quantidade: z.coerce.number().int({ message: 'Quantidade deve ser um numero inteiro' }).positive({ message: 'Quantidade deve ser maior que zero' }),
  valorUnitario: z.coerce.number().positive({ message: 'Valor unitario deve ser maior que zero' }).optional()
}).superRefine((data, ctx) => {
  if (!data.produtoId && !data.nome) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nome'],
      message: 'Nome do item e obrigatorio quando produtoId nao for informado'
    });
  }

  if (!data.produtoId && !data.valorUnitario) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['valorUnitario'],
      message: 'Valor unitario e obrigatorio quando produtoId nao for informado'
    });
  }
});

const cancelSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);
router.post('/', validate(createSchema), pedidosController.create);
router.patch('/:id/cancel', validate(cancelSchema), pedidosController.cancel);

module.exports = router;
