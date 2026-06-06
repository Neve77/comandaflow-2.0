const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const authRoutes = require('./http/routes/auth.routes');
const braceletRoutes = require('./http/routes/bracelets.routes');
const productRoutes = require('./http/routes/products.routes');
const comandaRoutes = require('./http/routes/comandas.routes');
const pedidoRoutes = require('./http/routes/pedidos.routes');
const clientRoutes = require('./http/routes/clients.routes');
const reportRoutes = require('./http/routes/reports.routes');
const aiRoutes = require('./http/routes/ai.routes');
const auditRoutes = require('./http/routes/audit.routes');
const backupRoutes = require('./http/routes/backup.routes');
const deviceRoutes = require('./http/routes/devices.routes');
const eventRoutes = require('./http/routes/events.routes');
const financeRoutes = require('./http/routes/finance.routes');
const inventoryRoutes = require('./http/routes/inventory.routes');
const loyaltyRoutes = require('./http/routes/loyalty.routes');
const mobileRoutes = require('./http/routes/mobile.routes');
const errorMiddleware = require('./http/middleware/error.middleware');


const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Auth specific rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
});

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^https?:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet({ contentSecurityPolicy: false }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'mobile', 'index.html'));
});

app.use('/auth', authLimiter, authRoutes);
app.use('/bracelets', braceletRoutes);
app.use('/products', productRoutes);
app.use('/comandas', comandaRoutes);
app.use('/pedidos', pedidoRoutes);
app.use('/clients', clientRoutes);
app.use('/reports', reportRoutes);
app.use('/ai', aiRoutes);
app.use('/audit', auditRoutes);
app.use('/backup', backupRoutes);
app.use('/devices', deviceRoutes);
app.use('/events', eventRoutes);
app.use('/finance', financeRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/loyalty', loyaltyRoutes);
app.use('/mobile', mobileRoutes);

app.use(errorMiddleware);

module.exports = app;
