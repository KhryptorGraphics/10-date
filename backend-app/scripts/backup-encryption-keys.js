/**
 * Script to securely backup encryption keys
 * This script should be run as a scheduled task (e.g., cron job)
 * 
 * Usage:
 * node scripts/backup-encryption-keys.js --output=/path/to/backup/directory
 * 
 * Options:
 * --output: Directory to store the backup file (default: ./backups)
 * --encrypt: Whether to encrypt the backup (default: true)
 * --passphrase: Passphrase for encrypting the backup (required if encrypt=true)
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { getConnection } = require('typeorm');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function bootstrap() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    output: './backups',
    encrypt: true,
    passphrase: null,
  };

  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key === '--output') options.output = value;
    if (key === '--encrypt') options.encrypt = value === 'true';
    if (key === '--passphrase') options.passphrase = value;
  });

  // Validate options
  if (options.encrypt && !options.passphrase) {
    console.error('Error: Passphrase is required when encryption is enabled.');
    console.error('Usage: node scripts/backup-encryption-keys.js --passphrase=your_secure_passphrase');
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  // Create NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get database connection
    const connection = getConnection();
    
    console.log('Backing up encryption keys...');
    
    // Get all encryption keys
    const keys = await connection.query(`
      SELECT * FROM encryption_keys
    `);
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      keys,
      metadata: {
        version: '1.0',
        keyCount: keys.length,
      },
    };
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `encryption-keys-backup-${timestamp}.json`;
    const backupPath = path.join(options.output, backupFilename);
    
    // Convert backup to JSON
    const backupJson = JSON.stringify(backup, null, 2);
    
    if (options.encrypt) {
      // Encrypt the backup
      console.log('Encrypting backup...');
      
      // Generate a random salt
      const salt = crypto.randomBytes(16);
      
      // Derive a key from the passphrase
      const key = crypto.scryptSync(options.passphrase, salt, 32);
      
      // Generate a random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      // Encrypt the backup
      let encryptedBackup = cipher.update(backupJson, 'utf8', 'hex');
      encryptedBackup += cipher.final('hex');
      
      // Create metadata
      const metadata = {
        algorithm: 'aes-256-cbc',
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        keyDerivation: 'scrypt',
      };
      
      // Create encrypted backup object
      const encryptedBackupObj = {
        metadata,
        encryptedData: encryptedBackup,
      };
      
      // Write encrypted backup to file
      fs.writeFileSync(backupPath + '.enc', JSON.stringify(encryptedBackupObj, null, 2));
      console.log(`Encrypted backup saved to ${backupPath}.enc`);
      
      // Create README with decryption instructions
      const readmePath = path.join(options.output, 'README.md');
      const readmeContent = `# Encryption Keys Backup

This directory contains encrypted backups of encryption keys.

## Decryption Instructions

To decrypt a backup file, use the following command:

\`\`\`bash
node scripts/restore-encryption-keys.js --input=/path/to/backup/file.json.enc --passphrase=your_secure_passphrase
\`\`\`

IMPORTANT: Keep the passphrase secure! If lost, the backup cannot be decrypted.
`;
      
      if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(readmePath, readmeContent);
      }
    } else {
      // Write backup to file without encryption
      fs.writeFileSync(backupPath, backupJson);
      console.log(`Backup saved to ${backupPath}`);
      
      console.warn('WARNING: The backup is not encrypted. It contains sensitive key material.');
      console.warn('Consider using the --encrypt option for production backups.');
    }
    
    console.log(`Backed up ${keys.length} encryption keys.`);
  } catch (error) {
    console.error(`Error during backup: ${error.message}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();