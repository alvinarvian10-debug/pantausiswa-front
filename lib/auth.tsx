'use client';

/**
 * Client-side session cache.
 *
 * Backend = NestJS di `sysch/back`. Login mengembalikan Bearer JWT
 * (disimpan via lib/api.ts). Cookie `pantausiswa.session` berisi token
 * yang sama agar `middleware.ts` bisa guard /dashboard/* server-side.
 * Salinan di localStorage ini hanya cache untuk UI client.
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

/** Petakan role backend (ADMIN/GURU/SISWA/SEKRETARIS) ke role frontend. */
export function roleFromBackend(role: string): SessionRole {
  const r = role.toUpperCase();
  if (r === 'ADMIN') return 'admin';
  if (r === 'GURU') return 'guru';
  if (r === 'SEKRETARIS' || r === 'SECRETARY') return 'secretary';
  return 'student';
}

/** Determines which role a /dashboard/* path is meant for. */
export function roleForPath(pathname: string): SessionRole {
  if (pathname.includes('/guru')) return 'guru';
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/secretary')) return 'secretary';
  return 'student';
}
