/**
 * Script to automate encryption key rotation
 * This script should be run as a scheduled task (e.g., cron job)
 * 
 * Usage:
 * node scripts/rotate-encryption-keys.js --type=master|user --age=90
 * 
 * Options:
 * --type: Type of keys to rotate (master or user)
 * --age: Age in days after which keys should be rotated (default: 90)
 * --user-id: Specific user ID to rotate keys for (optional)
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { EncryptionService } = require('../dist/common/services/encryption.service');
const { AuditLogService } = require('../dist/common/services/audit-log.service');
const { AuditAction, AuditResource } = require('../dist/common/services/audit-log.service');
const { getConnection } = require('typeorm');

async function bootstrap() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    type: 'user', // Default to rotating user keys
    age: 90, // Default to rotating keys older than 90 days
    userId: null, // Default to rotating keys for all users
  };

  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key === '--type') options.type = value;
    if (key === '--age') options.age = parseInt(value, 10);
    if (key === '--user-id') options.userId = value;
  });

  // Create NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get services
    const encryptionService = app.get(EncryptionService);
    const auditLogService = app.get(AuditLogService);
    
    console.log(`Starting key rotation for ${options.type} keys older than ${options.age} days...`);
    
    // Get database connection
    const connection = getConnection();
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.age);
    
    if (options.type === 'master') {
      // Master key rotation is a more complex operation that requires re-encrypting all DEKs
      console.log('Master key rotation requires manual intervention.');
      console.log('Please follow these steps:');
      console.log('1. Generate a new master key');
      console.log('2. Decrypt all DEKs with the old master key');
      console.log('3. Re-encrypt all DEKs with the new master key');
      console.log('4. Update the ENCRYPTION_MASTER_KEY environment variable');
      console.log('5. Restart the application');
    } else if (options.type === 'user') {
      // Rotate user DEKs
      let userIds = [];
      
      if (options.userId) {
        // Rotate keys for a specific user
        userIds = [options.userId];
      } else {
        // Get all users with keys older than the cutoff date
        const oldKeys = await connection.query(`
          SELECT DISTINCT user_id 
          FROM encryption_keys 
          WHERE key_type = 'DEK' 
          AND active = true 
          AND created_at < $1
        `, [cutoffDate]);
        
        userIds = oldKeys.map(key => key.user_id);
      }
      
      console.log(`Found ${userIds.length} users with keys to rotate.`);
      
      // Rotate keys for each user
      for (const userId of userIds) {
        try {
          console.log(`Rotating keys for user ${userId}...`);
          await encryptionService.rotateUserKeys(userId);
          
          // Log the key rotation
          await auditLogService.log(
            'system',
            AuditAction.UPDATE,
            AuditResource.ENCRYPTION_KEY,
            userId,
            { reason: 'Scheduled key rotation' }
          );
          
          console.log(`Successfully rotated keys for user ${userId}.`);
        } catch (error) {
          console.error(`Failed to rotate keys for user ${userId}: ${error.message}`);
        }
      }
    } else {
      console.error(`Invalid key type: ${options.type}`);
      process.exit(1);
    }
    
    console.log('Key rotation completed.');
  } catch (error) {
    console.error(`Error during key rotation: ${error.message}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();