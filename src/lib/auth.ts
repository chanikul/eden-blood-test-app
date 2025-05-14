import { cookies } from 'next/headers';
import { AdminRole } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';

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

export async function generateSessionToken(user: AdminUser): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const token = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  
  return token;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return { user: payload as AdminUser };
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

export async function verifySessionToken(token: string): Promise<AdminUser | null> {
  if (!process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    
    // Validate the user object structure
    if (payload && 
        typeof payload.email === 'string' && 
        (payload.role === AdminRole.ADMIN || payload.role === AdminRole.SUPER_ADMIN)) {
      return payload as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error verifying token:', error);
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
