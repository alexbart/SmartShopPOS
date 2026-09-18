import { getDarajaConfig } from '../config/daraja.config.js';

interface TokenCache {
  token: string;
  expiresAt: number; // epoch ms
}

let _cache: TokenCache | null = null;

/**
 * Returns a valid Daraja OAuth access token.
 * Caches in memory and refreshes 60 s before expiry.
 * Throws ValidationError if credentials are not configured.
 */
export async function getDarajaToken(): Promise<string> {
  const now = Date.now();
  if (_cache && _cache.expiresAt > now + 60_000) {
    return _cache.token;
  }

  const config = getDarajaConfig(); // throws ValidationError if unconfigured
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

  const response = await fetch(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { method: 'GET', headers: { Authorization: `Basic ${credentials}` } },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Daraja OAuth failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: string };
  const expiresIn = parseInt(data.expires_in, 10) * 1000;

  _cache = { token: data.access_token, expiresAt: now + expiresIn };
  return _cache.token;
}

export function clearDarajaTokenCache(): void {
  _cache = null;
}
