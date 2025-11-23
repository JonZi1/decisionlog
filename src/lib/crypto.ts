// Simple encryption for storing tokens
// Uses Web Crypto API with a derived key from a passphrase

const SALT_KEY = 'decision-log-salt';
const ENCRYPTED_TOKEN_KEY = 'decision-log-encrypted-token';

async function getKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptToken(token: string, passphrase: string): Promise<void> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await getKey(passphrase, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(token)
  );

  // Store salt, iv, and encrypted data
  const data = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    encrypted: Array.from(new Uint8Array(encrypted)),
  };

  localStorage.setItem(ENCRYPTED_TOKEN_KEY, JSON.stringify(data));
}

export async function decryptToken(passphrase: string): Promise<string | null> {
  const stored = localStorage.getItem(ENCRYPTED_TOKEN_KEY);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    const salt = new Uint8Array(data.salt);
    const iv = new Uint8Array(data.iv);
    const encrypted = new Uint8Array(data.encrypted);

    const key = await getKey(passphrase, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export function hasEncryptedToken(): boolean {
  return localStorage.getItem(ENCRYPTED_TOKEN_KEY) !== null;
}

export function clearEncryptedToken(): void {
  localStorage.removeItem(ENCRYPTED_TOKEN_KEY);
  localStorage.removeItem(SALT_KEY);
}

// Session-only token (not persisted)
let sessionToken: string | null = null;

export function setSessionToken(token: string): void {
  sessionToken = token;
}

export function getSessionToken(): string | null {
  return sessionToken;
}

export function clearSessionToken(): void {
  sessionToken = null;
}
