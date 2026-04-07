const { Router } = require('express');
const controller = require('./comments.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate, optionalAuth } = require('../../middleware/auth.middleware');
const v = require('./comments.validation');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comments on news articles
 */

/**
 * @swagger
 * /comments/news/{newsId}:
 *   get:
 *     summary: Get comments for a news article
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated comments
 */
router.get('/', optionalAuth, validate(v.allQuery, 'query'), controller.getAll);
router.get('/news/:newsId', validate(v.listQuery, 'query'), controller.getByNews);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a comment to a news article
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newsId, content]
 *             properties:
 *               newsId: { type: integer }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Comment created
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(v.create), controller.create);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Soft-delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
