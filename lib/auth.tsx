'use client';

/**
 * Client-side session cache.
 *
 * Sesi resmi hidup di cookie HttpOnly (`pantausiswa.session`, JWT) yang
 * diverifikasi server-side di `middleware.ts` — cookie-lah yang benar-benar
 * memblokir request tak berhak ke /dashboard/*. Salinan di localStorage ini
 * hanya cache untuk UI client (role, username, secretaryId); selalu diisi
 * dari respons /api/auth/login dan dibersihkan saat logout.
 */

export type SessionRole = 'student' | 'guru' | 'admin' | 'secretary';

export interface Session {
  role: SessionRole;
  username: string;
  /** Only set for secretary accounts — which class they manage. */
  secretaryId?: string;
}

const SESSION_KEY = 'pantausiswa.session';

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.role !== 'string') return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable (private mode, quota) — fail silently.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
}

/** Determines which role a /dashboard/* path is meant for. */
export function roleForPath(pathname: string): SessionRole {
  if (pathname.includes('/guru')) return 'guru';
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/secretary')) return 'secretary';
  return 'student';
}
