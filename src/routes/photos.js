const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const { requireUser, optionalUser, requireAdmin } = require('../middleware/auth');

const dimCache = new Map();

async function imageDimensions(url) {
  if (dimCache.has(url)) return dimCache.get(url);
  const filePath = path.join(__dirname, '..', url.replace(/^\//, ''));
  try {
    const sharp = require('sharp');
    const meta = await sharp(filePath).metadata();
    const dim = { width: meta.width || 1200, height: meta.height || 800 };
    dimCache.set(url, dim);
    return dim;
  } catch {
    return { width: 1200, height: 800 };
  }
}

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
    if (!onlyApproved && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const where = onlyApproved
      ? { approved: true, featured: true }
      : {};
    const orderBy = onlyApproved
      ? [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
      : [{ createdAt: 'desc' }];
    const photos = await prisma.photo.findMany({
      where,
      include: { uploader: { select: { fullName: true } } },
      orderBy
    });
    const capped = onlyApproved ? photos.slice(0, 15) : photos;
    const data = await Promise.all(capped.map(async p => {
      const dim = await imageDimensions(p.url);
      return {
        id: p.id, url: p.url, description: p.description,
        approved: p.approved, featured: p.featured, sortOrder: p.sortOrder,
        uploadedBy: p.uploadedBy,
        uploaderName: p.uploader.fullName,
        width: dim.width, height: dim.height,
        createdAt: p.createdAt
      };
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
        data: { url, description, approved: false, uploadedBy: req.user.id }
      });
      res.json({ data: photo });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
});

router.put('/', requireUser, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.photo.findUnique({ where: { id: req.body.id } });
    if (!existing) return res.status(404).json({ error: 'Foto no encontrada' });
    const photo = await prisma.photo.update({
      where: { id: req.body.id },
      data: { approved: true }
    });
    res.json({ data: photo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/featured', requireUser, requireAdmin, async (req, res) => {
  try {
    const { id, featured } = req.body;
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) return res.status(404).json({ error: 'Foto no encontrada' });
    if (featured) {
      const featuredCount = await prisma.photo.count({ where: { featured: true } });
      if (featuredCount >= 15) {
        return res.status(400).json({ error: 'Límite de 15 fotos en la galería. Quitá una primero.' });
      }
      const max = await prisma.photo.aggregate({
        where: { featured: true },
        _max: { sortOrder: true }
      });
      const updated = await prisma.photo.update({
        where: { id },
        data: { featured: true, sortOrder: (max._max.sortOrder ?? 0) + 1 }
      });
      return res.json({ data: updated });
    }
    const updated = await prisma.photo.update({
      where: { id },
      data: { featured: false }
    });
    await prisma.photo.updateMany({
      where: { featured: true, sortOrder: { gt: photo.sortOrder } },
      data: { sortOrder: { decrement: 1 } }
    });
    res.json({ data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/order', requireUser, requireAdmin, async (req, res) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids requerido' });
    const current = await prisma.photo.count({ where: { featured: true } });
    await prisma.photo.updateMany({
      where: { featured: true },
      data: { sortOrder: -1 }
    });
    let applied = 0;
    for (let i = 0; i < ids.length && applied < 15; i++) {
      const res2 = await prisma.photo.updateMany({
        where: { id: ids[i], featured: true },
        data: { sortOrder: i }
      });
      if (res2.count > 0) applied++;
    }
    const featuredIds = await prisma.photo.findMany({
      where: { featured: true, sortOrder: { lt: 0 } },
      select: { id: true }
    });
    for (const p of featuredIds) {
      await prisma.photo.updateMany({
        where: { id: p.id, sortOrder: { lt: 0 } },
        data: { sortOrder: applied }
      });
      applied++;
    }
    res.json({ data: { updated: Math.min(ids.length, 15), total: current } });
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
