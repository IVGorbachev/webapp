const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'webapp_db',
  user: process.env.DB_USER || 'webapp_user',
  password: process.env.DB_PASSWORD || 'webapp_pass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version VARCHAR(50) NOT NULL,
        environment VARCHAR(20) DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
        image_tag VARCHAR(255),
        deployed_by UUID REFERENCES users(id),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        finished_at TIMESTAMPTZ,
        logs TEXT
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
    `);

    logger.info('Database initialized successfully');
    await seedDemoData(client);
  } catch (err) {
    logger.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
};

const seedDemoData = async (client) => {
  let users = await client.query('SELECT id, role FROM users');

  if (users.rows.length === 0) {
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash('admin123', 10);
    const created = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin') RETURNING id, role`,
      ['Администратор', 'admin@deploykit.local', password_hash]
    );
    users = { rows: created.rows };
    logger.info('Demo admin created: admin@deploykit.local / admin123');
  }

  const demoTasks = [
    ['Настроить Docker Compose', 'Развернуть PostgreSQL, backend и frontend', 'done', 'high'],
    ['Подключить CI/CD пайплайн', 'Настроить GitHub Actions для автоматического деплоя', 'in_progress', 'high'],
    ['Проверить health-check', 'Убедиться, что /health возвращает статус ok', 'pending', 'medium'],
    ['Обновить документацию', 'Дополнить README инструкциями на русском', 'pending', 'low'],
    ['Настроить Kubernetes', 'Применить манифесты из папки k8s/', 'in_progress', 'medium'],
  ];

  for (const user of users.rows) {
    const count = await client.query('SELECT COUNT(*) FROM tasks WHERE user_id = $1', [user.id]);
    if (parseInt(count.rows[0].count, 10) > 0) continue;

    for (const [title, description, status, priority] of demoTasks) {
      await client.query(
        'INSERT INTO tasks (title, description, status, priority, user_id) VALUES ($1, $2, $3, $4, $5)',
        [title, description, status, priority, user.id]
      );
    }
  }

  const deplCount = await client.query('SELECT COUNT(*) FROM deployments');
  if (parseInt(deplCount.rows[0].count, 10) === 0) {
    const admin = users.rows.find(u => u.role === 'admin') || users.rows[0];
    await client.query(
      `INSERT INTO deployments (version, environment, status, image_tag, deployed_by, logs, finished_at)
       VALUES ($1, 'production', 'success', 'webapp-backend:v1.0.0', $2, $3, NOW()),
              ($4, 'staging', 'success', 'webapp-frontend:v1.0.1', $2, $5, NOW())`,
      [
        'v1.0.0', admin.id,
        'Запуск пайплайна развёртывания...\nВсе поды работают.\nРазвёртывание завершено!',
        'v1.0.1',
        'Тестовое развёртывание завершено успешно.',
      ]
    );
  }

  logger.info('Demo data seeded');
};

const seedTasksForUser = async (userId) => {
  const count = await query('SELECT COUNT(*) FROM tasks WHERE user_id = $1', [userId]);
  if (parseInt(count.rows[0].count, 10) > 0) return;

  const demoTasks = [
    ['Настроить Docker Compose', 'Развернуть PostgreSQL, backend и frontend', 'done', 'high'],
    ['Подключить CI/CD пайплайн', 'Настроить GitHub Actions для автоматического деплоя', 'in_progress', 'high'],
    ['Проверить health-check', 'Убедиться, что /health возвращает статус ok', 'pending', 'medium'],
    ['Обновить документацию', 'Дополнить README инструкциями на русском', 'pending', 'low'],
    ['Настроить Kubernetes', 'Применить манифесты из папки k8s/', 'in_progress', 'medium'],
  ];

  for (const [title, description, status, priority] of demoTasks) {
    await query(
      'INSERT INTO tasks (title, description, status, priority, user_id) VALUES ($1, $2, $3, $4, $5)',
      [title, description, status, priority, userId]
    );
  }
};

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, initDB, seedTasksForUser };
