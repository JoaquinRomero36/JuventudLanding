const { PrismaClient } = require('@prisma/client');

let prisma;

function getDb() {
  if (!prisma) {
    const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
    if (!url) throw new Error('DATABASE_URL no está configurada');
    prisma = new PrismaClient({ datasources: { db: { url } } });
  }
  return prisma;
}

function getUser(context) {
  const user = context.clientContext && context.clientContext.user;
  return user ? { id: user.sub, email: user.email } : null;
}

function requireUser(context) {
  const user = getUser(context);
  if (!user) throw new Error('No autorizado');
  return user;
}

async function getProfile(db, userId) {
  return db.profile.findUnique({ where: { id: userId } });
}

async function requireAdmin(db, context) {
  const user = requireUser(context);
  const profile = await getProfile(db, user.id);
  if (!profile || profile.role !== 'admin') throw new Error('Se requiere ser administrador');
  return { user, profile };
}

function ok(data) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, error: null }) };
}

function fail(status, msg) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: null, error: msg }) };
}

module.exports = { getDb, getUser, requireUser, getProfile, requireAdmin, ok, fail };
