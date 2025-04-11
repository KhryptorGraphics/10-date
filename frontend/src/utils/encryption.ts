/**
 * Client-side encryption utilities for end-to-end encryption
 * This implements the client side of the encryption protocol
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes
const SALT_LENGTH = 16; // bytes
const ITERATIONS = 100000;

/**
 * Interface for encrypted data
 */
export interface EncryptedData {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
  algorithm: string; // Algorithm used for encryption
}

/**
 * Generate a cryptographic key from a password
 * @param password The password to derive the key from
 * @param salt The salt to use (or generate a new one if not provided)
 * @returns The derived key and the salt used
 */
export async function deriveKey(
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  // Generate a random salt if not provided
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  }

  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive a key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  return { key, salt };
}

/**
 * Encrypt data with a password
 * @param data The data to encrypt
 * @param password The password to encrypt with
 * @returns The encrypted data
 */
export async function encryptWithPassword(
  data: string,
  password: string
): Promise<EncryptedData> {
  try {
    // Derive a key from the password
    const { key, salt } = await deriveKey(password);

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Convert data to buffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      dataBuffer
    );

    // Convert to base64
    const encryptedData = bufferToBase64(new Uint8Array(encryptedBuffer));
    const ivBase64 = bufferToBase64(iv);
    const saltBase64 = bufferToBase64(salt);

    return {
      encryptedData,
      iv: ivBase64,
      salt: saltBase64,
      algorithm: ALGORITHM,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with a password
 * @param encryptedData The encrypted data
 * @param password The password to decrypt with
 * @returns The decrypted data
 */
export async function decryptWithPassword(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  try {
    // Convert from base64
    const encryptedBuffer = base64ToBuffer(encryptedData.encryptedData);
    const iv = base64ToBuffer(encryptedData.iv);
    const salt = base64ToBuffer(encryptedData.salt);

    // Derive the key from the password and salt
    const { key } = await deriveKey(password, salt);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encryptedBuffer
    );

    // Convert buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key
 * @returns A new random encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to raw bytes
 * @param key The key to export
 * @returns The exported key as a Uint8Array
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exportedKey);
}

/**
 * Import a raw key
 * @param keyData The raw key data
 * @returns The imported CryptoKey
 */
export async function importKey(keyData: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with a CryptoKey
 * @param data The data to encrypt
 * @param key The key to encrypt with
 * @returns The encrypted data
 */
export async function encryptWithKey(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  try {
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Convert data to buffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      dataBuffer
    );

    // Convert to base64
    const encryptedData = bufferToBase64(new Uint8Array(encryptedBuffer));
    const ivBase64 = bufferToBase64(iv);

    return {
      encryptedData,
      iv: ivBase64,
      salt: '', // No salt needed for key-based encryption
      algorithm: ALGORITHM,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with a CryptoKey
 * @param encryptedData The encrypted data
 * @param key The key to decrypt with
 * @returns The decrypted data
 */
export async function decryptWithKey(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  try {
    // Convert from base64
    const encryptedBuffer = base64ToBuffer(encryptedData.encryptedData);
    const iv = base64ToBuffer(encryptedData.iv);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encryptedBuffer
    );

    // Convert buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Convert a buffer to a base64 string
 * @param buffer The buffer to convert
 * @returns The base64 string
 */
export function bufferToBase64(buffer: Uint8Array): string {
  const binary = Array.from(buffer)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  return btoa(binary);
}

/**
 * Convert a base64 string to a buffer
 * @param base64 The base64 string to convert
 * @returns The buffer
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Check if the Web Crypto API is available
 * @returns True if the Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' && 
         typeof crypto.getRandomValues !== 'undefined';
}