const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const productsController = require('../controllers/products.controller');

const router = express.Router();

const productSchema = z.object({
  nome: z.string().min(1),
  preco: z.string().transform((value) => parseFloat(value)).refine((value) => value > 0, { message: 'Preço deve ser maior que zero' }),
  categoria: z.string().min(1),
  estoque: z.string().transform((value) => parseInt(value)).refine((value) => value >= 0, { message: 'Estoque deve ser maior ou igual a zero' }),
  ativo: z.boolean().optional()
});

const updateSchema = productSchema.extend({
  id: z.string().uuid()
});

router.use(authenticate);
router.get('/', productsController.getAll);
router.get('/:id', validate(z.object({ id: z.string().uuid() })), productsController.getOne);
router.post('/', validate(productSchema), productsController.create);
router.put('/:id', validate(updateSchema), productsController.update);
router.patch('/:id/active', validate(z.object({ id: z.string().uuid(), ativo: z.boolean() })), productsController.toggleActive);
router.delete('/:id', validate(z.object({ id: z.string().uuid() })), productsController.delete);

module.exports = router;
