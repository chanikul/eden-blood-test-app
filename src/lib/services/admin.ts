import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { AdminRole } from '@prisma/client';

export interface AdminCreateInput {
  email: string;
  name: string;
  password: string;
  role?: AdminRole;
}

export interface AdminUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: AdminRole;
  active?: boolean;
}

export async function createAdmin(data: AdminCreateInput) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.admin.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role || AdminRole.ADMIN,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function updateAdmin(id: string, data: AdminUpdateInput) {
  const updateData: any = { ...data };
  
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    delete updateData.password;
  }

  return prisma.admin.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      updatedAt: true,
    },
  });
}

export async function validateAdminPassword(email: string, password: string) {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Looking up admin user:', { email });
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        active: true,
      },
    });

    console.log('Admin lookup result:', { 
      found: !!admin,
      active: admin?.active,
      role: admin?.role,
      hasPasswordHash: !!admin?.passwordHash
    });

    if (!admin || !admin.active) {
      console.log('Admin not found or inactive');
      return null;
    }

    console.log('Comparing passwords...');
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    console.log('Password comparison result:', { isValid });
    if (!isValid) return null;

    const { passwordHash, ...adminData } = admin;
    return adminData;
  } catch (error) {
    console.error('Error validating admin password:', error);
    return null;
  }
}

export async function generatePasswordResetToken(email: string) {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin || !admin.active) return null;

  const resetToken = crypto.randomUUID();
  const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      resetToken,
      resetTokenExpires,
    },
  });

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const admin = await prisma.admin.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!admin) return false;

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return true;
}

export async function listAdmins() {
  return prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getAdminById(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function updateLastLogin(id: string) {
  try {
    await prisma.$connect();
    return await prisma.admin.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        lastLoginAt: true
      }
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    return null;
  }
}
