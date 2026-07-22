const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const logger = require('../logger');

// GET /api/tasks
router.get('/', authenticate, async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT t.*, u.name as user_name FROM tasks t LEFT JOIN users u ON t.user_id = u.id WHERE t.user_id = $1';
  const params = [req.user.id];

  if (status) {
    sql += ` AND t.status = $${params.length + 1}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND t.priority = $${params.length + 1}`;
    params.push(priority);
  }

  sql += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), offset);

  try {
    const result = await query(sql, params);
    const countResult = await query(
      'SELECT COUNT(*) FROM tasks WHERE user_id = $1',
      [req.user.id]
    );
    res.json({
      tasks: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    logger.error('Get tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, priority = 'medium' } = req.body;

  try {
    const result = await query(
      'INSERT INTO tasks (title, description, priority, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, priority, req.user.id]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    logger.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('status').optional().isIn(['pending', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, status, priority } = req.body;

  try {
    const existing = await query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = await query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        updated_at = NOW()
      WHERE id = $5 AND user_id = $6 RETURNING *`,
      [title, description, status, priority, id, req.user.id]
    );
    res.json({ task: result.rows[0] });
  } catch (err) {
    logger.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted', id });
  } catch (err) {
    logger.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) as total
      FROM tasks WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ stats: result.rows[0] });
  } catch (err) {
    logger.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
