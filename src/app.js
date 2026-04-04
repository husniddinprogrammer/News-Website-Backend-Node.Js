const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const logger = require('./utils/logger');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { notFound, globalErrorHandler } = require('./middleware/error.middleware');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const newsRoutes = require('./modules/news/news.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const commentRoutes = require('./modules/comments/comments.routes');
const likeRoutes = require('./modules/likes/likes.routes');
const hashtagRoutes = require('./modules/hashtags/hashtags.routes');
const imageRoutes = require('./modules/images/images.routes');
const userRoutes = require('./modules/users/users.routes');

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

// ── HTTP logging ──────────────────────────────────────────────────────────────
app.use(
  morgan(config.app.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// ── Static files ──────────────────────────────────────────────────────────────
app.use(
  `/${config.upload.dir}`,
  (_req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); },
  express.static(path.resolve(config.upload.dir))
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.app.env });
});

// ── API docs ──────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(config.app.apiPrefix, apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
const prefix = config.app.apiPrefix;
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/news`, newsRoutes);
app.use(`${prefix}/categories`, categoryRoutes);
app.use(`${prefix}/comments`, commentRoutes);
app.use(`${prefix}/likes`, likeRoutes);
app.use(`${prefix}/hashtags`, hashtagRoutes);
app.use(`${prefix}/images`, imageRoutes);
app.use(`${prefix}/users`, userRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;
