const { Router } = require('express');
const controller = require('./hashtags.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const v = require('./hashtags.validation');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hashtags
 *   description: Hashtag management
 */

/**
 * @swagger
 * /hashtags:
 *   get:
 *     summary: List all hashtags
 *     tags: [Hashtags]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated hashtag list
 */
router.get('/', validate(v.listQuery, 'query'), controller.getAll);

/**
 * @swagger
 * /hashtags:
 *   post:
 *     summary: Create a hashtag (BOSS only)
 *     tags: [Hashtags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', authenticate, authorize('BOSS'), validate(v.create), controller.create);

/**
 * @swagger
 * /hashtags/{id}:
 *   delete:
 *     summary: Delete a hashtag (BOSS only)
 *     tags: [Hashtags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete('/:id', authenticate, authorize('BOSS'), controller.remove);

module.exports = router;
