const { Router } = require('express');
const controller = require('./likes.controller');
const { validate } = require('../../middleware/validate.middleware');
const { optionalAuth } = require('../../middleware/auth.middleware');
const { publicLimiter } = require('../../middleware/rateLimiter.middleware');
const v = require('./likes.validation');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Like/unlike news articles
 */

/**
 * @swagger
 * /likes:
 *   post:
 *     summary: Toggle like on a news article (works for both authenticated and anonymous users)
 *     tags: [Likes]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newsId]
 *             properties:
 *               newsId: { type: integer }
 *     responses:
 *       200:
 *         description: Returns liked status and total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked: { type: boolean }
 *                 likeCount: { type: integer }
 */
router.post('/', publicLimiter, optionalAuth, validate(v.toggle), controller.toggle);

module.exports = router;
