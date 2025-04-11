/**
 * Script to generate a secure encryption master key for HIPAA-compliant encryption
 * Run this script with: node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

// Generate a random 32-byte (256-bit) key for AES-256-GCM
const key = crypto.randomBytes(32);

// Convert to hex for storage in environment variables
const hexKey = key.toString('hex');

console.log('Generated Encryption Master Key:');
console.log(hexKey);
console.log('\nAdd this to your .env file as:');
console.log(`ENCRYPTION_MASTER_KEY=${hexKey}`);
console.log('\nWARNING: Keep this key secure! If lost, all encrypted data will be unrecoverable.');
console.log('For production, consider using a key management service (KMS) like AWS KMS or HashiCorp Vault.');