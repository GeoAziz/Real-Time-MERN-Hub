import bcrypt from 'bcryptjs';
import request from 'supertest';
import Conversation from '../../server/models/conversation.model.js';
import Message from '../../server/models/message.model.js';
import User from '../../server/models/user.model.js';
import { createTestApp } from './createTestApp.js';
import {
  clearTestDatabase,
  closeTestDatabase,
  connectTestDatabase,
} from './testDatabase.js';

describe('message routes', () => {
  let app;
  let agent;
  let alice;
  let bob;

  beforeAll(async () => {
    await connectTestDatabase();
    app = createTestApp();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    alice = await User.create({
      fullName: 'Alice',
      username: 'alice',
      password: await bcrypt.hash('Password123', 10),
      gender: 'female',
      profilePic: '',
    });
    bob = await User.create({
      fullName: 'Bob',
      username: 'bob',
      password: await bcrypt.hash('Password123', 10),
      gender: 'male',
      profilePic: '',
    });
    agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'alice', password: 'Password123' });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('creates and paginates conversation messages', async () => {
    const conversation = await Conversation.create({
      type: 'direct',
      members: [alice._id, bob._id],
      participants: [alice._id, bob._id],
      createdBy: alice._id,
    });

    await Message.create(
      Array.from({ length: 25 }).map((_, index) => ({
        conversationId: conversation._id,
        senderId: index % 2 === 0 ? alice._id : bob._id,
        receiverId: index % 2 === 0 ? bob._id : alice._id,
        message: `message-${index}`,
      }))
    );

    const pageOne = await agent.get(`/api/messages/${conversation._id}?type=direct&limit=10`);
    expect(pageOne.status).toBe(200);
    expect(pageOne.body.messages).toHaveLength(10);
    expect(pageOne.body.hasMore).toBe(true);

    const nextCursor = pageOne.body.nextCursor;
    const pageTwo = await agent.get(`/api/messages/${conversation._id}?type=direct&limit=10&cursor=${nextCursor}`);
    expect(pageTwo.status).toBe(200);
    expect(pageTwo.body.messages).toHaveLength(10);
  });

  it('sends a message through a direct conversation', async () => {
    const direct = await agent.post('/api/conversations/direct').send({ username: 'bob' });
    expect(direct.status).toBe(201);

    const sent = await agent
      .post(`/api/messages/send/${direct.body._id}`)
      .send({ message: 'hello bob' });

    expect(sent.status).toBe(201);
    expect(sent.body.message).toBe('hello bob');
    expect(sent.body.conversationId).toBeDefined();
  });
});
