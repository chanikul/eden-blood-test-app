import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function createClientUser({
  email,
  password,
  name,
  dateOfBirth,
  mobile,
}: {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  mobile?: string;
}) {
  const existingUser = await prisma.clientUser.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.clientUser.create({
    data: {
      email,
      passwordHash,
      name,
      dateOfBirth,
      mobile,
      active: true,
      lastLoginAt: new Date(),
    },
  });

  return user;
}

export async function findClientUserByEmail(email: string) {
  return prisma.clientUser.findUnique({
    where: { email },
  });
}

export async function associateOrderWithClient(orderId: string, clientId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { clientId },
  });
}
