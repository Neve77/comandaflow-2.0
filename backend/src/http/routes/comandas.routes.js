const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const comandasController = require('../../controllers/comandas.controller');

const router = express.Router();

const cpfRegex = /^[0-9]{11}$/;
const phoneRegex = /^[0-9]{10,15}$/;

const openSchema = z.object({
  number: z.string().min(1),
  clienteNome: z.string().min(1, 'Nome do cliente e obrigatorio'),
  clienteCpf: z.string().transform((value) => value.replace(/\D/g, '')).refine((value) => cpfRegex.test(value), {
    message: 'CPF deve conter 11 digitos numericos'
  }),
  clienteTelefone: z.string().transform((value) => value.replace(/\D/g, '')).refine((value) => phoneRegex.test(value), {
    message: 'Telefone deve conter entre 10 e 15 digitos numericos'
  }),
  clienteEmail: z.string().email().optional().or(z.literal('')),
  clienteNascimento: z.string().optional().or(z.literal('')),
  eventId: z.string().uuid().optional().or(z.literal(''))
}).transform((data) => ({
  ...data,
  clienteEmail: data.clienteEmail || '',
  clienteNascimento: data.clienteNascimento || null,
  eventId: data.eventId || null
}));

const closeSchema = z.object({ id: z.string().uuid() });
const idSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);
router.get('/', comandasController.listOpen);
router.post('/open', validate(openSchema), comandasController.open);
router.get('/history/:number', comandasController.historyByBraceletNumber);
router.post('/:id/close', validate(closeSchema), comandasController.close);
router.get('/:id', validate(idSchema), comandasController.get);

module.exports = router;
