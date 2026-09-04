'use client';

/**
 * Client-side session management.
 *
 * This app has no real backend yet, so "sessions" live in localStorage —
 * good enough to stop casual URL-typing/demo-button access, but NOT a
 * substitute for real server-side auth. A determined attacker can still
 * read the client JS bundle or disable JS to see the first server-rendered
 * paint. The correct long-term fix is a real backend (e.g. the
 * Prisma/MySQL setup already being explored) that issues an HttpOnly
 * session cookie validated in Next.js middleware — cookies (unlike
 * localStorage) are readable server-side, which is what actually lets you
 * block a request before any page content is ever sent to the browser.
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
