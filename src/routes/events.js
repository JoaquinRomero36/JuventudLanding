const express = require('express');
const prisma = require('../db');
const { requireUser, optionalUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalUser, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = await prisma.event.findMany({
      where: { date: { gte: today } },
      include: {
        _count: { select: { regs: true } },
        regs: req.user
          ? { where: { userId: req.user.id } }
          : false
      },
      orderBy: { date: 'asc' }
    });
    const data = events.map(e => ({
      id: e.id, title: e.title, description: e.description,
      date: e.date, time: e.time, location: e.location,
      max_participants: e.maxParticipants,
      registrationCount: e._count.regs,
      registered: req.user ? e.regs && e.regs.length > 0 : false
    }));
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', requireUser, requireAdmin, async (req, res) => {
  try {
    const { title, description, date, time, location, max_participants } = req.body;
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return res.status(400).json({ error: 'La fecha del evento no puede ser en el pasado' });
    }
    const event = await prisma.event.create({
      data: {
        title, description: description || '', time: time || '',
        location: location || '', maxParticipants: max_participants || 0,
        date: eventDate, createdBy: req.user.id
      }
    });
    res.json({ data: event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/', requireUser, requireAdmin, async (req, res) => {
  try {
    const { id, title, description, date, time, location, max_participants } = req.body;
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return res.status(400).json({ error: 'La fecha del evento no puede ser en el pasado' });
    }
    const event = await prisma.event.update({
      where: { id },
      data: {
        title, description, time, location,
        maxParticipants: max_participants,
        date: eventDate
      }
    });
    res.json({ data: event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', requireUser, requireAdmin, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.query.id } });
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
