const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');
const { signToken, requireUser } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.profile.create({
      data: { id, email, password: hash, fullName: fullName || '' }
    });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    const user = await prisma.profile.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    }
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', requireUser, async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, fullName: req.user.fullName, role: req.user.role } });
});

router.put('/profile', requireUser, async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = await prisma.profile.update({
      where: { id: req.user.id },
      data: { fullName: fullName ?? req.user.fullName }
    });
    res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
