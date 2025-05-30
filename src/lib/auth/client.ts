import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const alg = 'HS256';

interface ClientJWTPayload {
  id: string;
  email: string;
  name: string;
}

export async function createClientToken(user: ClientJWTPayload) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  cookies().set('eden_client_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

export async function verifyClientToken(token: string) {
  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as unknown as ClientJWTPayload;

    // Verify user still exists and is active
    const user = await prisma.clientUser.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

export async function getClientSession() {
  const token = cookies().get('eden_client_token')?.value;
  if (!token) return null;

  return verifyClientToken(token);
}

export async function signOutClient() {
  cookies().delete('eden_client_token');
}
