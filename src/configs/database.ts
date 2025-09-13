import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();
const config = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'sim_service_dev',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'sim_service_prod',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment as keyof typeof config]);

export default db;
