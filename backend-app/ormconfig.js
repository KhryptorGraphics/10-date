require('dotenv').config();
const { DataSource } = require('typeorm');

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASS || 'app_password',
  database: process.env.DB_NAME || 'dating_app',
  entities: ['dist/src/**/*.entity.js'],
  synchronize: false,
  logging: true,
});
