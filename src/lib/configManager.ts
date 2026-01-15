/**
 * Configuration Manager
 * 
 * Handles loading configuration from:
 * 1. Optional app-config.local.json file (for local development)
 * 2. localStorage (for runtime overrides via Admin Settings)
 * 
 * File config takes precedence unless explicitly overridden in Admin UI.
 */

import { Credentials } from '@/types/sage';

const CONFIG_STORAGE_KEY = 'sage-demo-config';
const CONFIG_FILE_PATH = '/app-config.local.json';

interface ConfigState {
  credentials: Credentials | null;
  configSource: 'file' | 'localStorage' | 'none';
  fileConfigLoaded: boolean;
}

let cachedConfig: ConfigState | null = null;

/**
 * Attempts to load configuration from the local JSON file
 */
async function loadFileConfig(): Promise<Credentials | null> {
  try {
    const response = await fetch(CONFIG_FILE_PATH);
    if (response.ok) {
      const config = await response.json();
      return {
        clientId: config.clientId || '',
        clientSecret: config.clientSecret || '',
        subscriptionClientId: config.subscriptionClientId || '',
        subscriptionClientSecret: config.subscriptionClientSecret || '',
        productCode: config.productCode || 'SAGE_ONE',
        platform: config.platform || 'UK',
        businessTypeCode: config.businessTypeCode || 'SOLE_TRADER',
      };
    }
  } catch {
    // File doesn't exist or couldn't be loaded, which is fine
  }
  return null;
}

/**
 * Loads configuration from localStorage
 */
function loadLocalStorageConfig(): Credentials | null {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Invalid JSON or no data
  }
  return null;
}

/**
 * Saves configuration to localStorage
 */
export function saveConfig(credentials: Credentials): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(credentials));
  // Update cache
  if (cachedConfig) {
    cachedConfig.credentials = credentials;
    cachedConfig.configSource = 'localStorage';
  }
}

/**
 * Clears configuration from localStorage
 */
export function clearConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  cachedConfig = null;
}

/**
 * Gets the current configuration, loading from file or localStorage as needed
 */
export async function getConfig(): Promise<ConfigState> {
  // Try to load file config first
  const fileConfig = await loadFileConfig();
  const localConfig = loadLocalStorageConfig();
  
  if (fileConfig) {
    cachedConfig = {
      credentials: fileConfig,
      configSource: 'file',
      fileConfigLoaded: true,
    };
  } else if (localConfig) {
    cachedConfig = {
      credentials: localConfig,
      configSource: 'localStorage',
      fileConfigLoaded: false,
    };
  } else {
    cachedConfig = {
      credentials: null,
      configSource: 'none',
      fileConfigLoaded: false,
    };
  }
  
  return cachedConfig;
}

/**
 * Gets cached configuration synchronously (may be stale if not initialized)
 */
export function getCachedConfig(): ConfigState | null {
  return cachedConfig;
}

/**
 * Checks if credentials are configured and valid
 */
export function hasValidCredentials(creds: Credentials | null): boolean {
  if (!creds) return false;
  return !!(
    creds.clientId &&
    creds.clientSecret &&
    creds.subscriptionClientId &&
    creds.subscriptionClientSecret
  );
}

/**
 * Gets the API base URL for Sage sandbox
 */
export function getApiBaseUrl(): string {
  return 'https://api.sandbox.sbc.sage.com';
}

/**
 * Gets the subscription API base URL
 */
export function getSubscriptionApiUrl(): string {
  return 'https://api.sandbox.sbc.sage.com/slcsadapter/v2';
}

/**
 * Gets the OAuth token URL
 */
export function getTokenUrl(): string {
  return 'https://oauth.sage.com/oauth/token';
}
