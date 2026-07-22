require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const prisma = require('./db');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const messagesRoutes = require('./routes/messages');
const likesRoutes = require('./routes/likes');
const photosRoutes = require('./routes/photos');
const registrationsRoutes = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/registrations', registrationsRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

async function start() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {});
  } catch (err) {
    console.error('Error al conectar:', err);
    process.exit(1);
  }
}

start();
