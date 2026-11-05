/**
 * The auth session is deliberately short-lived: every app start begins signed out
 * so the user has to log in again. Runtime persistence still uses localStorage so
 * in-session token refresh keeps working.
 */
export const SESSION_STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
  organization: 'organization',
} as const;

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: unknown;
  organization: unknown;
}

export function saveStoredSession(session: StoredSession): void {
  localStorage.setItem(SESSION_STORAGE_KEYS.accessToken, session.accessToken);
  localStorage.setItem(SESSION_STORAGE_KEYS.refreshToken, session.refreshToken);
  localStorage.setItem(SESSION_STORAGE_KEYS.user, JSON.stringify(session.user));
  localStorage.setItem(SESSION_STORAGE_KEYS.organization, JSON.stringify(session.organization));
}

export function clearStoredSession(): void {
  for (const key of Object.values(SESSION_STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}
