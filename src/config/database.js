const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma Query');
  });
}

prisma.$on('error', (e) => {
  logger.error({ message: e.message }, 'Prisma Error');
});

prisma.$on('warn', (e) => {
  logger.warn({ message: e.message }, 'Prisma Warning');
});

module.exports = prisma;
