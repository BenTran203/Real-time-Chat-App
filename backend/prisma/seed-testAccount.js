import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function TestAccount(prisma) {
  console.log('🌱 Seeding customer user...\n');

  const email = 'Testing@test.com';
  const password = '12345689';

  // Check if admin already exists
  const existingAcc = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

    if (existingAcc) {
    console.log('Account already exists. Skipping creation.');
    return; 
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create customer user
  const testAccount = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      username: 'Jason Candy',
      isEmailVerified: true,
      bio: 'This is a test account',
    }
  });

  console.log('Test account created successfully!\n');
}

async function Main() {
    console.log('Starting database seeding process...\n');
    try {
        console.log('Seeding test account...');
        await TestAccount(prisma)
    } catch (error) {
     console.error(' Seeding process failed!');
    console.error('Error details:', error);
    throw error; 
    }
}

Main()
  .catch((e) => {
    console.error(' A critical error occurred during the seeding process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });