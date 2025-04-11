import { useState, useCallback, useEffect } from 'react';
import * as EncryptionUtils from '../utils/encryption';

/**
 * Hook for client-side encryption in React components
 * Provides methods for encrypting and decrypting data
 */
export function useEncryption() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the Web Crypto API is available
  useEffect(() => {
    const supported = EncryptionUtils.isCryptoAvailable();
    setIsSupported(supported);
    
    if (!supported) {
      setError('Web Crypto API is not supported in this browser');
    }
  }, []);

  // Initialize encryption key
  const initializeEncryption = useCallback(async (password?: string) => {
    try {
      setError(null);
      
      let key: CryptoKey;
      
      if (password) {
        // Derive key from password
        const { key: derivedKey } = await EncryptionUtils.deriveKey(password);
        key = derivedKey;
      } else {
        // Generate a new random key
        key = await EncryptionUtils.generateEncryptionKey();
      }
      
      setEncryptionKey(key);
      setIsInitialized(true);
      
      return key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize encryption';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Encrypt data with the current key
  const encryptData = useCallback(async (data: string): Promise<EncryptionUtils.EncryptedData | null> => {
    try {
      setError(null);
      
      if (!isSupported) {
        throw new Error('Web Crypto API is not supported');
      }
      
      if (!encryptionKey) {
        throw new Error('Encryption key is not initialized');
      }
      
      return await EncryptionUtils.encryptWithKey(data, encryptionKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt data';
      setError(errorMessage);
      return null;
    }
  }, [encryptionKey, isSupported]);

  // Decrypt data with the current key
  const decryptData = useCallback(async (encryptedData: EncryptionUtils.EncryptedData): Promise<string | null> => {
    try {
      setError(null);
      
      if (!isSupported) {
        throw new Error('Web Crypto API is not supported');
      }
      
      if (!encryptionKey) {
        throw new Error('Encryption key is not initialized');
      }
      
      return await EncryptionUtils.decryptWithKey(encryptedData, encryptionKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt data';
      setError(errorMessage);
      return null;
    }
  }, [encryptionKey, isSupported]);

  // Encrypt data with a password
  const encryptWithPassword = useCallback(async (data: string, password: string): Promise<EncryptionUtils.EncryptedData | null> => {
    try {
      setError(null);
      
      if (!isSupported) {
        throw new Error('Web Crypto API is not supported');
      }
      
      return await EncryptionUtils.encryptWithPassword(data, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt data';
      setError(errorMessage);
      return null;
    }
  }, [isSupported]);

  // Decrypt data with a password
  const decryptWithPassword = useCallback(async (encryptedData: EncryptionUtils.EncryptedData, password: string): Promise<string | null> => {
    try {
      setError(null);
      
      if (!isSupported) {
        throw new Error('Web Crypto API is not supported');
      }
      
      return await EncryptionUtils.decryptWithPassword(encryptedData, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt data';
      setError(errorMessage);
      return null;
    }
  }, [isSupported]);

  // Export the current encryption key
  const exportCurrentKey = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      
      if (!isSupported) {
        throw new Error('Web Crypto API is not supported');
      }
      
      if (!encryptionKey) {
        throw new Error('Encryption key is not initialized');
      }
      
      const keyData = await EncryptionUtils.exportKey(encryptionKey);
      return EncryptionUtils.bufferToBase64(keyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export key';
      setError(errorMessage);
      return null;
    }
  }, [encryptionKey, isSupported]);

  // Import an encryption key
  const importKey = useCallback(async (keyData: string): Promise<boolean> => {
    try {
      setError(null);
      
      if (!isSupported) {
        throw new Error('Web Crypto API is not supported');
      }
      
      const keyBuffer = EncryptionUtils.base64ToBuffer(keyData);
      const key = await EncryptionUtils.importKey(keyBuffer);
      
      setEncryptionKey(key);
      setIsInitialized(true);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import key';
      setError(errorMessage);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isInitialized,
    error,
    initializeEncryption,
    encryptData,
    decryptData,
    encryptWithPassword,
    decryptWithPassword,
    exportCurrentKey,
    importKey,
  };
}