const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

function parseToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function requireUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const payload = parseToken(auth.slice(7));
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  const user = await prisma.profile.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }
  req.user = user;
  next();
}

async function optionalUser(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const payload = parseToken(auth.slice(7));
    if (payload) {
      const user = await prisma.profile.findUnique({ where: { id: payload.sub } });
      if (user) req.user = user;
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }
  next();
}

module.exports = { signToken, parseToken, requireUser, optionalUser, requireAdmin };
