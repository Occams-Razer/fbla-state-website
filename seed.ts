const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Hash the password before saving (10 "rounds" of scrambling)
  const hashedAdminPassword = await bcrypt.hash('fbla_password2026', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedAdminPassword, 
    },
  });

  // (Optional: You can keep your item/claim creation code here as well)

  console.log('Database seeded with ENCRYPTED admin credentials!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });