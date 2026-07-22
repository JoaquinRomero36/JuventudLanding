const express = require('express');
const prisma = require('../db');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireUser, async (req, res) => {
  try {
    const { messageId } = req.body;
    const existing = await prisma.messageLike.findFirst({
      where: { messageId, userId: req.user.id }
    });
    if (existing) {
      await prisma.messageLike.delete({ where: { id: existing.id } });
      res.json({ data: { liked: false } });
    } else {
      await prisma.messageLike.create({
        data: { messageId, userId: req.user.id }
      });
      res.json({ data: { liked: true } });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
