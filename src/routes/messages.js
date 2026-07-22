const express = require('express');
const prisma = require('../db');
const { requireUser, optionalUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalUser, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { parentId: null },
      include: {
        user: { select: { fullName: true } },
        _count: { select: { likes: true, replies: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const data = await Promise.all(messages.map(async msg => {
      const userId = req.user?.id;
      const userLiked = userId ? !!(await prisma.messageLike.findFirst({
        where: { messageId: msg.id, userId }
      })) : false;
      const replies = await prisma.message.findMany({
        where: { parentId: msg.id },
        include: {
          user: { select: { fullName: true } },
          _count: { select: { likes: true } }
        },
        orderBy: { createdAt: 'asc' }
      });
      const repliesData = await Promise.all(replies.map(async r => ({
        id: r.id, content: r.content, userId: r.userId,
        fullName: r.user.fullName,
        createdAt: r.createdAt,
        likesCount: r._count.likes,
        userLiked: userId ? !!(await prisma.messageLike.findFirst({
          where: { messageId: r.id, userId }
        })) : false
      })));
      return {
        id: msg.id, content: msg.content, userId: msg.userId,
        fullName: msg.user.fullName,
        createdAt: msg.createdAt,
        likesCount: msg._count.likes,
        userLiked,
        replies: repliesData
      };
    }));
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', requireUser, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }
    const msg = await prisma.message.create({
      data: { content: content.trim(), parentId: parentId || null, userId: req.user.id }
    });
    res.json({ data: msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', requireUser, async (req, res) => {
  try {
    const msg = await prisma.message.findUnique({ where: { id: req.query.id } });
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
    if (msg.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tenés permiso para eliminar' });
    }
    await prisma.message.delete({ where: { id: req.query.id } });
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
