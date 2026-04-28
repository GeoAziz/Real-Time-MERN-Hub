import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { systemBinary: '/usr/bin/mongod' },
  });
  await mongoose.connect(mongoServer.getUri());
};

export const clearTestDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDatabase = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
