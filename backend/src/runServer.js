const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

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
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.set('io', io);

const startServer = (port = process.env.PORT || 3002) => {
  return new Promise((resolve, reject) => {
    const listener = server.listen(port, () => {
      resolve(listener);
    });
    listener.on('error', reject);
  });
};

const stopServer = () => {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
};

module.exports = {
  startServer,
  stopServer,
  app,
  io,
  server,
};
