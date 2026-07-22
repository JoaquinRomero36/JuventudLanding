const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const { requireUser, optionalUser, requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'));
    } else {
      cb(null, true);
    }
  }
});

const router = express.Router();

router.get('/', optionalUser, async (req, res) => {
  try {
    const onlyApproved = req.query.onlyApproved !== 'false';
    const filter = onlyApproved ? { approved: true } : {};
    if (!onlyApproved && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const photos = await prisma.photo.findMany({
      where: filter,
      include: { uploader: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const data = photos.map(p => ({
      id: p.id, url: p.url, description: p.description,
      approved: p.approved, uploadedBy: p.uploadedBy,
      uploaderName: p.uploader.fullName,
      createdAt: p.createdAt
    }));
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', requireUser, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La foto no puede superar los 10MB' });
      }
      return res.status(400).json({ error: err.message });
    }
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No se seleccionó ninguna foto' });
      const description = req.body.description || '';
      const url = '/uploads/' + file.filename;
      const photo = await prisma.photo.create({
        data: { url, description, approved: true, uploadedBy: req.user.id }
      });
      res.json({ data: photo });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
});

router.put('/', requireUser, requireAdmin, async (req, res) => {
  try {
    const photo = await prisma.photo.update({
      where: { id: req.body.id },
      data: { approved: true }
    });
    res.json({ data: photo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', requireUser, requireAdmin, async (req, res) => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: req.query.id } });
    if (photo) {
      const filePath = path.join(__dirname, '..', photo.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await prisma.photo.delete({ where: { id: req.query.id } });
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
