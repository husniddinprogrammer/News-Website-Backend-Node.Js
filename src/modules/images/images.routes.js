const { Router } = require('express');
const controller = require('./images.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { upload } = require('../../middleware/upload.middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: News image management
 */

/**
 * @swagger
 * /images/news/{newsId}:
 *   get:
 *     summary: Get all images for a news article
 *     tags: [Images]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of images
 */
router.get('/news/:newsId', controller.getByNews);

/**
 * @swagger
 * /images/news/{newsId}:
 *   post:
 *     summary: Upload images for a news article (multipart/form-data)
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: newsId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded
 */
router.post(
  '/news/:newsId',
  authenticate,
  authorize('BOSS', 'ADMIN'),
  upload.array('images', 10),
  controller.upload
);

/**
 * @swagger
 * /images/{id}:
 *   delete:
 *     summary: Soft-delete an image
 *     tags: [Images]
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
