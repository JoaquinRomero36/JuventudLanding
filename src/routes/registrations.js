const express = require('express');
const prisma = require('../db');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireUser, async (req, res) => {
  try {
    const regs = await prisma.registration.findMany({
      where: { userId: req.user.id },
      select: { eventId: true }
    });
    const data = regs.map(r => r.eventId);
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', requireUser, async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    if (event.maxParticipants > 0) {
      const count = await prisma.registration.count({ where: { eventId } });
      if (count >= event.maxParticipants) {
        return res.status(400).json({ error: 'Evento completo' });
      }
    }
    const reg = await prisma.registration.create({
      data: { eventId, userId: req.user.id }
    });
    res.json({ data: reg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', requireUser, async (req, res) => {
  try {
    await prisma.registration.deleteMany({
      where: { eventId: req.query.eventId, userId: req.user.id }
    });
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
