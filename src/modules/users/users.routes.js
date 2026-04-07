const { Router } = require('express');
const controller = require('./users.controller');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const v = require('./users.validation');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (BOSS only)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (BOSS only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by username, email or name
 *     responses:
 *       200:
 *         description: Paginated user list
 *       403:
 *         description: BOSS role required
 */
router.get('/', authenticate, authorize('BOSS'), validate(v.listQuery, 'query'), controller.getAll);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Change user role (BOSS only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, BOSS]
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Cannot change your own role
 *       404:
 *         description: User not found
 */
router.patch('/:id/role', authenticate, authorize('BOSS'), validate(v.updateRole), controller.updateRole);

/**
 * @swagger
 * /users/{id}/block:
 *   patch:
 *     summary: Block or unblock a user (BOSS only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isBlocked]
 *             properties:
 *               isBlocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User blocked/unblocked
 *       400:
 *         description: Cannot block yourself
 *       403:
 *         description: Cannot block a BOSS user
 */
router.patch('/:id/block', authenticate, authorize('BOSS'), validate(v.updateBlocked), controller.updateBlocked);

module.exports = router;
