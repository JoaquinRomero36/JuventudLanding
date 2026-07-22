const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  const adminId = uuidv4();
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.profile.upsert({
    where: { email: 'admin@juventudcba.com' },
    update: { password: adminHash, fullName: 'Admin Juventud', role: 'admin' },
    create: {
      id: adminId,
      email: 'admin@juventudcba.com',
      password: adminHash,
      fullName: 'Admin Juventud',
      role: 'admin'
    }
  });
  console.log('Admin listo:', admin.email);

  const userHash = await bcrypt.hash('test123', 10);
  const user = await prisma.profile.upsert({
    where: { email: 'test@juventudcba.com' },
    update: { password: userHash, fullName: 'Test User' },
    create: {
      id: userId,
      email: 'test@juventudcba.com',
      password: userHash,
      fullName: 'Test User'
    }
  });
  console.log('Usuario listo:', user.email);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
