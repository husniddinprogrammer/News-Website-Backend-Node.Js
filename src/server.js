require('dotenv').config();
const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const prisma = require('./config/database');
const { connectElasticsearch } = require('./config/elasticsearch');

const server = http.createServer(app);

async function start() {
  try {
    // Verify DB connection
    await prisma.$connect();
    logger.info('PostgreSQL connected');

    // Optional services (non-fatal)
    await connectElasticsearch();

    server.listen(config.app.port, () => {
      logger.info(`Server running on port ${config.app.port} [${config.app.env}]`);
      logger.info(`API: http://localhost:${config.app.port}${config.app.apiPrefix}`);
      logger.info(`Docs: http://localhost:${config.app.port}/api-docs`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});

start();
