import { cookies } from 'next/headers';
import { AdminRole } from '@prisma/client';

const TOKEN_NAME = 'eden_admin_token';

export interface AdminUser {
  email: string;
  role: AdminRole;
}

export interface Session {
  user?: AdminUser;
}

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  // This function is no longer used, we use validateAdminPassword from admin service instead
  return false;
}

export function generateSessionToken(user: AdminUser): string {
  // For development, we'll use a simple encoded string
  // In production, you would use a proper session management system
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const decodedToken = Buffer.from(token, 'base64').toString();
    const user = JSON.parse(decodedToken) as AdminUser;
    return { user };
  } catch (error) {
    console.error('Error decoding session token:', error);
    return null;
  }
}

export function verifySessionToken(token: string): AdminUser | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const user = JSON.parse(decoded) as AdminUser;
    
    // Validate the user object structure
    if (user && user.email && (user.role === AdminRole.ADMIN || user.role === AdminRole.SUPER_ADMIN)) {
      return user;
    }
    return null;
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(TOKEN_NAME);
  return cookie?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  
  const user = verifySessionToken(token);
  return !!user;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}
