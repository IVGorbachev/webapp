const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../logger');

// GET /api/deployments
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.name as deployed_by_name
       FROM deployments d
       LEFT JOIN users u ON d.deployed_by = u.id
       ORDER BY d.started_at DESC
       LIMIT 50`
    );
    res.json({ deployments: result.rows });
  } catch (err) {
    logger.error('Get deployments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/deployments
router.post('/', authenticate, requireAdmin, [
  body('version').trim().notEmpty().withMessage('Version is required'),
  body('environment').optional().isIn(['development', 'staging', 'production']),
  body('image_tag').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { version, environment = 'development', image_tag } = req.body;

  try {
    const result = await query(
      `INSERT INTO deployments (version, environment, image_tag, deployed_by, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [version, environment, image_tag, req.user.id]
    );

    const deployment = result.rows[0];

    // Simulate async deployment process
    simulateDeployment(deployment.id);

    logger.info(`Deployment started: ${version} -> ${environment}`);
    res.status(201).json({ deployment });
  } catch (err) {
    logger.error('Create deployment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/deployments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.name as deployed_by_name
       FROM deployments d
       LEFT JOIN users u ON d.deployed_by = u.id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json({ deployment: result.rows[0] });
  } catch (err) {
    logger.error('Get deployment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate deployment lifecycle
async function simulateDeployment(deploymentId) {
  const steps = [
    { status: 'running', delay: 500, log: 'Starting deployment pipeline...\nPulling Docker image...' },
    { status: 'running', delay: 1500, log: 'Applying Kubernetes manifests...\nWaiting for pods to be ready...' },
    { status: 'success', delay: 2500, log: 'All pods healthy.\nDeployment complete!\nService is live.' },
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    try {
      await query(
        `UPDATE deployments SET status = $1, logs = $2, finished_at = CASE WHEN $1 IN ('success','failed') THEN NOW() ELSE NULL END WHERE id = $3`,
        [step.status, step.log, deploymentId]
      );
    } catch (err) {
      logger.error('Deployment simulation error:', err);
    }
  }
}

module.exports = router;
