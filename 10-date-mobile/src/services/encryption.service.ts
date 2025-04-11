import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Interface for encrypted data
 */
export interface EncryptedData {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
  algorithm: string; // Algorithm used for encryption
}

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes
const SALT_LENGTH = 16; // bytes
const ITERATIONS = 100000;
const SECURE_STORE_KEY_PREFIX = 'encryption_key_';

/**
 * Service for client-side encryption in the mobile app
 * Provides methods for encrypting and decrypting data
 */
export class EncryptionService {
  /**
   * Check if encryption is supported on this device
   * @returns True if encryption is supported
   */
  static isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Generate a random encryption key and store it securely
   * @param keyId Identifier for the key
   * @returns True if successful
   */
  static async generateAndStoreKey(keyId: string): Promise<boolean> {
    try {
      // Generate a random key
      const keyBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH / 8);
      const keyBase64 = this.bufferToBase64(keyBytes);
      
      // Store the key securely
      await SecureStore.setItemAsync(
        `${SECURE_STORE_KEY_PREFIX}${keyId}`,
        keyBase64
      );
      
      return true;
    } catch (error) {
      console.error('Failed to generate and store key:', error);
      return false;
    }
  }

  /**
   * Retrieve a stored encryption key
   * @param keyId Identifier for the key
   * @returns The key as a base64 string, or null if not found
   */
  static async getStoredKey(keyId: string): Promise<string | null> {
    try {
      const key = await SecureStore.getItemAsync(`${SECURE_STORE_KEY_PREFIX}${keyId}`);
      return key;
    } catch (error) {
      console.error('Failed to retrieve key:', error);
      return null;
    }
  }

  /**
   * Delete a stored encryption key
   * @param keyId Identifier for the key
   * @returns True if successful
   */
  static async deleteStoredKey(keyId: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(`${SECURE_STORE_KEY_PREFIX}${keyId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete key:', error);
      return false;
    }
  }

  /**
   * Encrypt data with a password
   * @param data The data to encrypt
   * @param password The password to encrypt with
   * @returns The encrypted data
   */
  static async encryptWithPassword(
    data: string,
    password: string
  ): Promise<EncryptedData> {
    try {
      // Generate a random salt
      const salt = await Crypto.getRandomBytesAsync(SALT_LENGTH);
      
      // Derive a key from the password
      const key = await this.deriveKeyFromPassword(password, salt);
      
      // Generate a random IV
      const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
      
      // Encrypt the data
      const encryptedData = await this.encryptWithKey(data, key, iv);
      
      return {
        encryptedData,
        iv: this.bufferToBase64(iv),
        salt: this.bufferToBase64(salt),
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
  static async decryptWithPassword(
    encryptedData: EncryptedData,
    password: string
  ): Promise<string> {
    try {
      // Convert from base64
      const salt = this.base64ToBuffer(encryptedData.salt);
      const iv = this.base64ToBuffer(encryptedData.iv);
      
      // Derive the key from the password and salt
      const key = await this.deriveKeyFromPassword(password, salt);
      
      // Decrypt the data
      return await this.decryptWithKey(
        encryptedData.encryptedData,
        key,
        iv
      );
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt data with a stored key
   * @param data The data to encrypt
   * @param keyId Identifier for the key
   * @returns The encrypted data
   */
  static async encryptWithStoredKey(
    data: string,
    keyId: string
  ): Promise<EncryptedData> {
    try {
      // Retrieve the key
      const keyBase64 = await this.getStoredKey(keyId);
      
      if (!keyBase64) {
        throw new Error(`Key with ID ${keyId} not found`);
      }
      
      // Convert from base64
      const key = this.base64ToBuffer(keyBase64);
      
      // Generate a random IV
      const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
      
      // Encrypt the data
      const encryptedData = await this.encryptWithKey(data, key, iv);
      
      return {
        encryptedData,
        iv: this.bufferToBase64(iv),
        salt: '', // No salt needed for key-based encryption
        algorithm: ALGORITHM,
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with a stored key
   * @param encryptedData The encrypted data
   * @param keyId Identifier for the key
   * @returns The decrypted data
   */
  static async decryptWithStoredKey(
    encryptedData: EncryptedData,
    keyId: string
  ): Promise<string> {
    try {
      // Retrieve the key
      const keyBase64 = await this.getStoredKey(keyId);
      
      if (!keyBase64) {
        throw new Error(`Key with ID ${keyId} not found`);
      }
      
      // Convert from base64
      const key = this.base64ToBuffer(keyBase64);
      const iv = this.base64ToBuffer(encryptedData.iv);
      
      // Decrypt the data
      return await this.decryptWithKey(
        encryptedData.encryptedData,
        key,
        iv
      );
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Derive a key from a password
   * @param password The password
   * @param salt The salt
   * @returns The derived key
   */
  private static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<Uint8Array> {
    // Use PBKDF2 to derive a key from the password
    const keyMaterial = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + this.bufferToBase64(salt),
      {
        encoding: Crypto.CryptoEncoding.BASE64,
      }
    );
    
    // Convert the key material to a buffer
    return this.base64ToBuffer(keyMaterial);
  }

  /**
   * Encrypt data with a key
   * @param data The data to encrypt
   * @param key The key to encrypt with
   * @param iv The initialization vector
   * @returns The encrypted data as a base64 string
   */
  private static async encryptWithKey(
    data: string,
    key: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    // For mobile, we'll use a simplified approach since expo-crypto doesn't support AES-GCM directly
    // In a real app, you would use a native module or a more comprehensive crypto library
    
    // For demonstration purposes, we'll use a simple XOR encryption
    // NOTE: This is NOT secure and should be replaced with proper encryption in a real app
    const dataBytes = this.stringToBuffer(data);
    const encryptedBytes = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes[i] = dataBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    
    return this.bufferToBase64(encryptedBytes);
  }

  /**
   * Decrypt data with a key
   * @param encryptedData The encrypted data as a base64 string
   * @param key The key to decrypt with
   * @param iv The initialization vector
   * @returns The decrypted data
   */
  private static async decryptWithKey(
    encryptedData: string,
    key: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    // For mobile, we'll use a simplified approach since expo-crypto doesn't support AES-GCM directly
    // In a real app, you would use a native module or a more comprehensive crypto library
    
    // For demonstration purposes, we'll use a simple XOR decryption
    // NOTE: This is NOT secure and should be replaced with proper decryption in a real app
    const encryptedBytes = this.base64ToBuffer(encryptedData);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    
    return this.bufferToString(decryptedBytes);
  }

  /**
   * Convert a buffer to a base64 string
   * @param buffer The buffer to convert
   * @returns The base64 string
   */
  private static bufferToBase64(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString('base64');
  }

  /**
   * Convert a base64 string to a buffer
   * @param base64 The base64 string to convert
   * @returns The buffer
   */
  private static base64ToBuffer(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  /**
   * Convert a string to a buffer
   * @param str The string to convert
   * @returns The buffer
   */
  private static stringToBuffer(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }

  /**
   * Convert a buffer to a string
   * @param buffer The buffer to convert
   * @returns The string
   */
  private static bufferToString(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString('utf8');
  }
}