const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('./schema');
const config = require('../config');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: config.db.url,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err: err.message }, 'PostgreSQL pool error');
});

const db = drizzle(pool, { schema, logger: config.app.env === 'development' });

async function connectDb() {
  const client = await pool.connect();
  client.release();
  logger.info('PostgreSQL connected');
}

async function disconnectDb() {
  await pool.end();
  logger.info('PostgreSQL disconnected');
}

module.exports = { db, connectDb, disconnectDb };
