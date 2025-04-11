import { DataSource } from 'typeorm';
import dataSource from './typeorm.config.js';
import { UserEntity } from './user/user.entity/user.entity.js';
import { Interest } from './user/user.entity/interest.entity.js';

async function seed() {
  await dataSource.initialize();

  // Seed interests
  const interests = ['Music', 'Sports', 'Movies', 'Travel', 'Reading', 'Cooking'];
  for (const name of interests) {
    const existing = await dataSource.getRepository(Interest).findOne({ where: { name } });
    if (!existing) {
      const interest = dataSource.getRepository(Interest).create({ name });
      await dataSource.getRepository(Interest).save(interest);
    }
  }

  // Seed admin user
  const bcrypt = await import('bcrypt');

  const adminEmail = 'admin@example.com';
  const existingAdmin = await dataSource.getRepository(UserEntity).findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const admin = dataSource.getRepository(UserEntity).create({
      email: adminEmail,
      passwordHash: await bcrypt.hash('adminpassword', 10),
      name: 'Admin',
      age: 30,
      role: 'admin',
    });
    await dataSource.getRepository(UserEntity).save(admin);
  }

  console.log('Seeding complete');
  await dataSource.destroy();
}

seed().catch(console.error);
