const request = require('supertest');
const { app } = require('../src/server');

// Mock DB
jest.mock('../src/db', () => ({
  query: jest.fn(),
  initDB: jest.fn(),
  pool: { on: jest.fn(), end: jest.fn() },
}));

const { query } = require('../src/db');
const bcrypt = require('bcryptjs');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      query.mockResolvedValueOnce({ rows: [] }); // Check existing
      query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          created_at: new Date().toISOString(),
        }],
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'taken@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);
      query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-123',
          name: 'Test User',
          email: 'test@example.com',
          password_hash: hash,
          role: 'user',
        }],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject invalid password', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-123',
          email: 'test@example.com',
          password_hash: hash,
          role: 'user',
        }],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'any' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
    });
  });
});
