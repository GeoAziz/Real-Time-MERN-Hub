import request from 'supertest';
import bcrypt from 'bcryptjs';
import User from '../../server/models/user.model.js';
import { createTestApp } from './createTestApp.js';
import {
  clearTestDatabase,
  closeTestDatabase,
  connectTestDatabase,
} from './testDatabase.js';

describe('auth routes', () => {
  let app;

  beforeAll(async () => {
    await connectTestDatabase();
    app = createTestApp();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('logs in a valid user', async () => {
    await User.create({
      fullName: 'Test User',
      username: 'testuser',
      password: await bcrypt.hash('Password123', 10),
      gender: 'male',
      profilePic: '',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'Password123' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('rejects an invalid signup payload', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      fullName: 'A',
      username: 'bad user',
      password: 'short',
      confirmPassword: 'short',
      gender: 'unknown',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
