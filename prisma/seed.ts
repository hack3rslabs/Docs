import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'employer@docs.com';
  const password = 'Edocs@8792#$$';
  
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    console.log('✅ Admin user created: admin@example.com / 12345');
  } else {
    console.log('ℹ️ Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
