const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const clientsController = require('../controllers/clients.controller');

const router = express.Router();

const cpfSchema = z.object({
  cpf: z.string().transform((value) => value.replace(/\D/g, '')).refine((value) => /^[0-9]{11}$/.test(value), {
    message: 'CPF deve conter 11 dígitos numéricos'
  })
});

router.use(authenticate);
router.get('/', clientsController.listClients);
router.get('/:cpf/history', validate(cpfSchema), clientsController.getClientHistory);

module.exports = router;