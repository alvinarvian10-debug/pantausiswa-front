import * as jose from 'jose';

export const SESSION_COOKIE = 'pantausiswa.session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export interface SessionPayload {
  sub: string;
  username: string;
  role: 'admin' | 'guru' | 'student' | 'secretary';
  displayName: string | null;
  secretaryId: string | null;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET belum diisi di .env');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: Omit<SessionPayload, never>): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey());
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.username !== 'string' ||
      !['admin', 'guru', 'student', 'secretary'].includes(payload.role as string)
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role as SessionPayload['role'],
      displayName: typeof payload.displayName === 'string' ? payload.displayName : null,
      secretaryId: typeof payload.secretaryId === 'string' ? payload.secretaryId : null,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  };
}

export function hrefForRole(role: SessionPayload['role']): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'guru':
      return '/dashboard/guru';
    case 'secretary':
      return '/dashboard/secretary';
    default:
      return '/dashboard/student/beranda';
  }
}
