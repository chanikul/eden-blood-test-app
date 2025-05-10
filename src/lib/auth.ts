import { cookies } from 'next/headers';

const TOKEN_NAME = 'eden_admin_token';

// Hardcoded admin credentials for development
const ADMIN_EMAIL = 'admin@edenclinic.co.uk';
const ADMIN_PASSWORD = 'test123';

export interface AdminUser {
  email: string;
  role: 'admin';
}

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function generateSessionToken(user: AdminUser): string {
  // For development, we'll use a simple encoded string
  // In production, you would use a proper session management system
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

export function verifySessionToken(token: string): AdminUser | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const user = JSON.parse(decoded) as AdminUser;
    
    // Validate the user object structure
    if (user && user.email && user.role === 'admin') {
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
