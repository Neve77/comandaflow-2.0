const app = require('./app');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const setupSocket = require('./realtime/socket');

dotenv.config();

const server = http.createServer(app);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return /^https?:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$/.test(origin);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

// Make io available in app for emitting events
app.set('io', io);
app.set('connectedSockets', 0);
app.set('mobileClients', 0);
setupSocket({ io, app });

const PORT = process.env.PORT || 3002;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} ja esta em uso. Reutilize o backend ativo ou libere a porta antes de iniciar outro servidor.`);
    app.set('serverError', { code: error.code, message: error.message, port: PORT });
    return;
  }

  console.error('Erro ao iniciar servidor:', error);
  app.set('serverError', { code: error.code, message: error.message, port: PORT });
});

server.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
