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

/**
 * Verify and decode a JWT token
 * @param token The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export async function verifyJWT(token: string): Promise<{ email: string; role: AdminRole | 'PATIENT'; id?: string } | null> {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    
    return payload as { email: string; role: AdminRole | 'PATIENT'; id?: string };
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}

export async function getServerSession(): Promise<Session | null> {
  console.log('=== GET SERVER SESSION DEBUG ===');
  const cookieStore = cookies();
  const adminToken = cookieStore.get(ADMIN_TOKEN_NAME)?.value;
  const patientToken = cookieStore.get(PATIENT_TOKEN_NAME)?.value;
  // Patient token takes precedence if both are present
  const token = patientToken || adminToken;

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
  const tokenName = isPatient ? PATIENT_TOKEN_NAME : ADMIN_TOKEN_NAME;
  
  // Delete the specific token
  cookieStore.delete(tokenName);
  
  // For patient logout, also clear any potential admin token to ensure full logout
  if (isPatient) {
    // Clear both tokens to ensure complete logout
    cookieStore.delete(ADMIN_TOKEN_NAME);
    
    // Also clear any other session-related cookies
    cookieStore.delete('supabase-auth-token');
    cookieStore.delete('sb-refresh-token');
    cookieStore.delete('sb-access-token');
  }
}

export async function getPatientFromToken(): Promise<PatientUser | null> {
  console.log('=== GET PATIENT FROM TOKEN DEBUG ===');
  
  // Force cookie revalidation by accessing the cookie store
  const cookieStore = cookies();
  const patientToken = cookieStore.get(PATIENT_TOKEN_NAME)?.value;
  
  // If no token exists, return null immediately
  if (!patientToken) {
    console.log('No patient token found in cookies');
    return null;
  }
  
  try {
    // Attempt to decode and verify our custom token
    const decoded = await verifyJWT(patientToken);
    if (!decoded || !decoded.id || decoded.role !== 'PATIENT') {
      console.log('Invalid patient token format or expired');
      clearAuthCookie(true);
      return null;
    }
    
    // Token is valid, now check if the user exists in the database
    const patient = await prisma.clientUser.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        active: true
      }
    });
    
    // Only return patient if found and active
    if (patient && patient.active) {
      console.log('Valid patient found from token:', patient.id);
      return {
        id: patient.id,
        email: patient.email,
        role: 'PATIENT',
        stripeCustomerId: patient.stripeCustomerId || undefined
      };
    } else {
      console.log('Patient not found or inactive:', decoded.id);
      clearAuthCookie(true);
    }
  } catch (error) {
    console.error('Error verifying patient from token:', error);
    clearAuthCookie(true);
  }
  
  return null;
  
  return null;
}

export async function getAdminFromToken(token?: string): Promise<{ id: string; email: string; role: AdminRole } | null> {
  // If token is not provided, try to get it from cookies
  if (!token) {
    const cookieStore = cookies();
    token = cookieStore.get(ADMIN_TOKEN_NAME)?.value;
  }

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    if (
      typeof payload === 'object' && 
      payload !== null && 
      'email' in payload && 
      'role' in payload &&
      (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN')
    ) {
      // Get the admin from the database to get their ID
      const admin = await prisma.admin.findUnique({
        where: { email: String(payload.email) },
        select: { id: true, email: true, role: true }
      });
      
      if (admin) {
        return {
          id: admin.id,
          email: admin.email,
          role: admin.role
        };
      }
    }
  } catch (error) {
    console.error('Error verifying admin token:', error);
  }

  return null;
}
