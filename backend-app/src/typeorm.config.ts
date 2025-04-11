import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'teamrsi12teamrsi12',
  database: process.env.DB_NAME || 'dating_app',
  entities: ['src/**/*.entity.ts'],
  synchronize: true, // Disable in production, use migrations instead
  logging: true,
});