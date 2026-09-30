import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to create the admin user.',
    );
  }

  const adminExists = await prisma.user.findUnique({
    where: { email },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: 'admin',
        email,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    console.log('✅ Admin user created.');
  } else {
    console.log('ℹ️ Admin user already exists.');
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
