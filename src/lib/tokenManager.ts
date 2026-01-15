/**
 * Token Manager for Dual OAuth
 * 
 * Manages two separate OAuth2 client-credentials tokens:
 * 1. Subscription Token - for tenant creation and subscription metadata
 * 2. Tenant Token - for tenant-scoped operations (bank accounts, transactions, P&L)
 * 
 * Features:
 * - In-memory only storage (never persisted to disk)
 * - Auto-refresh before expiry (60s buffer)
 * - Exposes metadata (audience, scope, expiry) for Developer Mode
 */

import { getTokenUrl } from './configManager';

export type TokenType = 'subscription' | 'tenant';

interface TokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
  scope?: string;
  audience?: string;
  tokenType: string;
}

interface TokenMetadata {
  expiresAt: number;
  expiresIn: number; // seconds until expiry
  scope?: string;
  audience?: string;
  isValid: boolean;
  lastRefresh: number | null;
}

// In-memory token storage - never persisted
const tokens: Record<TokenType, TokenData | null> = {
  subscription: null,
  tenant: null,
};

// Last refresh timestamps
const lastRefreshTimes: Record<TokenType, number | null> = {
  subscription: null,
  tenant: null,
};

// Refresh promises to prevent concurrent refreshes
const refreshPromises: Record<TokenType, Promise<TokenData | null> | null> = {
  subscription: null,
  tenant: null,
};

// Refresh buffer - refresh 60 seconds before expiry
const REFRESH_BUFFER_MS = 60 * 1000;

/**
 * Fetches a new token using client credentials flow
 */
async function fetchToken(
  clientId: string,
  clientSecret: string,
  audience?: string
): Promise<TokenData | null> {
  const tokenUrl = getTokenUrl();
  
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  if (audience) {
    body.append('audience', audience);
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token fetch failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope,
      audience: audience,
      tokenType: data.token_type || 'Bearer',
    };
  } catch (error) {
    console.error('Token fetch error:', error);
    return null;
  }
}

/**
 * Checks if a token is valid and not expired (with buffer)
 */
function isTokenValid(token: TokenData | null): boolean {
  if (!token) return false;
  return token.expiresAt > Date.now() + REFRESH_BUFFER_MS;
}

/**
 * Gets or refreshes a token
 */
export async function getToken(
  type: TokenType,
  clientId: string,
  clientSecret: string,
  audience?: string
): Promise<string | null> {
  // Check if existing token is valid
  if (isTokenValid(tokens[type])) {
    return tokens[type]!.accessToken;
  }

  // If a refresh is already in progress, wait for it
  if (refreshPromises[type]) {
    const result = await refreshPromises[type];
    return result?.accessToken || null;
  }

  // Start a new refresh
  refreshPromises[type] = fetchToken(clientId, clientSecret, audience);
  
  try {
    const newToken = await refreshPromises[type];
    tokens[type] = newToken;
    lastRefreshTimes[type] = Date.now();
    return newToken?.accessToken || null;
  } finally {
    refreshPromises[type] = null;
  }
}

/**
 * Gets token metadata for display in Developer Mode (never exposes raw token)
 */
export function getTokenMetadata(type: TokenType): TokenMetadata {
  const token = tokens[type];
  
  if (!token) {
    return {
      expiresAt: 0,
      expiresIn: 0,
      isValid: false,
      lastRefresh: lastRefreshTimes[type],
    };
  }
  
  const now = Date.now();
  const expiresIn = Math.max(0, Math.floor((token.expiresAt - now) / 1000));
  
  return {
    expiresAt: token.expiresAt,
    expiresIn,
    scope: token.scope,
    audience: token.audience,
    isValid: isTokenValid(token),
    lastRefresh: lastRefreshTimes[type],
  };
}

/**
 * Clears a specific token (e.g., on logout or credential change)
 */
export function clearToken(type: TokenType): void {
  tokens[type] = null;
  lastRefreshTimes[type] = null;
}

/**
 * Clears all tokens
 */
export function clearAllTokens(): void {
  tokens.subscription = null;
  tokens.tenant = null;
  lastRefreshTimes.subscription = null;
  lastRefreshTimes.tenant = null;
}

/**
 * Forces a token refresh (useful for testing connection)
 */
export async function forceRefreshToken(
  type: TokenType,
  clientId: string,
  clientSecret: string,
  audience?: string
): Promise<boolean> {
  clearToken(type);
  const token = await getToken(type, clientId, clientSecret, audience);
  return token !== null;
}
