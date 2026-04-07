const { Router } = require('express');
const controller = require('./news.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate, authorize, optionalAuth } = require('../../middleware/auth.middleware');
const { publicLimiter } = require('../../middleware/rateLimiter.middleware');
const v = require('./news.validation');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: News
 *   description: News management and browsing
 */

/**
 * @swagger
 * /news:
 *   get:
 *     summary: List news with filters, sorting, and pagination
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [most_viewed, most_liked, most_commented, id_desc, id_asc] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category slug
 *       - in: query
 *         name: hashtag
 *         schema: { type: string }
 *         description: Hashtag slug
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: time
 *         schema: { type: string, enum: [today, this_week, this_month] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PUBLISHED, DELETED] }
 *         description: Admin only
 *     responses:
 *       200:
 *         description: Paginated list of news
 */
router.get('/', publicLimiter, optionalAuth, validate(v.listQuery, 'query'), controller.getAll);

/**
 * @swagger
 * /news/{slug}:
 *   get:
 *     summary: Get news article by slug (increments view count)
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: News article detail
 *       404:
 *         description: Not found
 */
router.get('/slug/:slug', publicLimiter, controller.getBySlug);

/**
 * @swagger
 * /news/{id}:
 *   get:
 *     summary: Get news by ID (admin)
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: News detail
 */
router.get('/:id', authenticate, authorize('BOSS', 'ADMIN'), controller.getById);

/**
 * @swagger
 * /news:
 *   post:
 *     summary: Create a news article
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, shortDescription, categoryId]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               shortDescription: { type: string }
 *               categoryId: { type: integer }
 *               status: { type: string, enum: [DRAFT, PUBLISHED] }
 *               hashtags: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: News created
 */
router.post('/', authenticate, authorize('BOSS', 'ADMIN'), validate(v.create), controller.create);

/**
 * @swagger
 * /news/{id}:
 *   put:
 *     summary: Update a news article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', authenticate, authorize('BOSS', 'ADMIN'), validate(v.update), controller.update);

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     summary: Soft-delete a news article (status → DELETED)
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/:id', authenticate, authorize('BOSS', 'ADMIN'), controller.remove);

module.exports = router;
