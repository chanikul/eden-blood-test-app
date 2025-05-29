import { cookies } from 'next/headers';
import { AdminRole } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const ADMIN_TOKEN_NAME = 'eden_admin_token';
const PATIENT_TOKEN_NAME = 'eden_patient_token';

export interface AdminUser {
  email: string;
  role: AdminRole;
}

export interface PatientUser {
  id: string;
  email: string;
  role: 'PATIENT';
  stripeCustomerId?: string;
}

export interface Session {
  user?: AdminUser | PatientUser;
}

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  // This function is no longer used, we use validateAdminPassword from admin service instead
  return false;
}

export async function generateSessionToken(user: AdminUser | PatientUser): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  // Include ID in token payload for patient users
  const payload: { email: string; role: AdminRole | 'PATIENT'; id?: string } = {
    email: user.email,
    role: user.role
  };
  if (user.role === 'PATIENT') {
    payload.id = user.id;
  }
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  
  return token;
}

export async function getServerSession(): Promise<Session | null> {
  console.log('=== GET SERVER SESSION DEBUG ===');
  const cookieStore = cookies();
  const adminToken = cookieStore.get(ADMIN_TOKEN_NAME)?.value;
  const patientToken = cookieStore.get(PATIENT_TOKEN_NAME)?.value;
  const token = adminToken || patientToken;

  console.log('Available cookies:', cookieStore.getAll().map(c => c.name));
  console.log('Token found:', { hasToken: !!token, type: patientToken ? 'patient' : adminToken ? 'admin' : 'none' });

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // Validate payload has required fields
    if (
      typeof payload === 'object' && 
      payload !== null && 
      'email' in payload && 
      'role' in payload
    ) {
      if (payload.role === 'PATIENT' && 'id' in payload) {
        const patient = await prisma.clientUser.findUnique({
          where: { id: String(payload.id) },
          select: {
            id: true,
            email: true,
            stripeCustomerId: true
          }
        });
        if (patient) {
          const patientUser: PatientUser = {
            id: patient.id,
            email: patient.email,
            role: 'PATIENT',
            stripeCustomerId: patient.stripeCustomerId || undefined
          };
          return { user: patientUser };
        }
        return null;
      } else if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
        const adminUser: AdminUser = {
          email: String(payload.email),
          role: payload.role as AdminRole
        };
        return { user: adminUser };
      }
    }
    return null;
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

export async function verifySessionToken(token: string): Promise<AdminUser | PatientUser | null> {
  console.log('=== VERIFY SESSION TOKEN DEBUG ===');
  if (!process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // Validate payload has required fields
    if (
      typeof payload === 'object' && 
      payload !== null && 
      'email' in payload && 
      'role' in payload
    ) {
      if (payload.role === 'PATIENT' && 'id' in payload) {
        const patient = await prisma.clientUser.findUnique({
          where: { id: String(payload.id) },
          select: {
            id: true,
            email: true,
            stripeCustomerId: true
          }
        });
        if (patient) {
          const patientUser: PatientUser = {
            id: patient.id,
            email: patient.email,
            role: 'PATIENT',
            stripeCustomerId: patient.stripeCustomerId || undefined
          };
          return patientUser;
        }
        return null;
      } else if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
        const adminUser: AdminUser = {
          email: String(payload.email),
          role: payload.role as AdminRole
        };
        return adminUser;
      }
    }
    return null;
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_TOKEN_NAME)?.value || cookieStore.get(PATIENT_TOKEN_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  
  const user = await verifySessionToken(token);
  return !!user;
}

export function setAuthCookie(token: string, isPatient: boolean = false) {
  const cookieStore = cookies();
  cookieStore.set(isPatient ? PATIENT_TOKEN_NAME : ADMIN_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export function clearAuthCookie(isPatient: boolean = false) {
  const cookieStore = cookies();
  cookieStore.delete(isPatient ? PATIENT_TOKEN_NAME : ADMIN_TOKEN_NAME);
}

export async function getPatientFromToken(): Promise<PatientUser | null> {
  console.log('=== GET PATIENT FROM TOKEN DEBUG ===');
  const session = await getServerSession();
  console.log('Session result:', { hasSession: !!session, userRole: session?.user?.role });
  if (session?.user && session.user.role === 'PATIENT') {
    const patient = await prisma.clientUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true
      }
    });
    if (patient) {
      return {
        id: patient.id,
        email: patient.email,
        role: 'PATIENT',
        stripeCustomerId: patient.stripeCustomerId || undefined
      };
    }
  }
  return null;
}
