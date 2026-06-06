const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const prisma = require('../infra/prisma/client');
const auditService = require('./audit.service');

dotenv.config();

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    const error = new Error('Credenciais invalidas');
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Credenciais invalidas');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  await auditService.writeAudit({
    userId: user.id,
    action: 'login',
    entity: 'User',
    entityId: user.id,
    metadata: { email: user.email }
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  };
};

module.exports = { login };
