const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/server');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  initDB: jest.fn(),
  seedTasksForUser: jest.fn().mockResolvedValue(undefined),
  pool: {
    on: jest.fn(),
    end: jest.fn(),
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
  },
}));

const { query } = require('../src/db');
const { JWT_SECRET } = require('../src/middleware/auth');

const mockUser = { id: 'user-uuid-1', name: 'Dev User', email: 'dev@test.com', role: 'user' };
const authToken = jwt.sign({ userId: mockUser.id }, JWT_SECRET, { expiresIn: '1h' });

describe('Tasks Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.mockImplementation((sql) => {
      if (sql.includes('SELECT id, name, email, role FROM users')) {
        return Promise.resolve({ rows: [mockUser] });
      }
      return Promise.resolve({ rows: [] });
    });
  });

  describe('GET /api/tasks', () => {
    it('should return tasks list', async () => {
      const fakeTasks = [
        { id: 't1', title: 'Task 1', status: 'pending', priority: 'high', user_id: mockUser.id },
        { id: 't2', title: 'Task 2', status: 'done', priority: 'low', user_id: mockUser.id },
      ];

      query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: fakeTasks })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        id: 'new-task-id',
        title: 'New Task',
        description: 'Test',
        priority: 'medium',
        status: 'pending',
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
      };

      query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [newTask] });

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Task', description: 'Test', priority: 'medium' });

      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe('New Task');
    });

    it('should validate empty title', async () => {
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid priority', async () => {
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Task', priority: 'urgent' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const updated = { id: 't1', title: 'Updated', status: 'done', priority: 'high' };

      query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [{ id: 't1' }] })
        .mockResolvedValueOnce({ rows: [updated] });

      const res = await request(app)
        .put('/api/tasks/t1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('done');
    });

    it('should return 404 for non-existent task', async () => {
      query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/tasks/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'done' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [{ id: 't1' }] });

      const res = await request(app)
        .delete('/api/tasks/t1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/удалена/i);
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('should return task statistics', async () => {
      query
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({
          rows: [{ pending: '3', in_progress: '1', done: '5', total: '9' }],
        });

      const res = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('total');
      expect(res.body.stats.total).toBe('9');
    });
  });
});
