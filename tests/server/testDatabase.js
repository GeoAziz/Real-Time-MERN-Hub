import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';

let mongoServer;

export const connectTestDatabase = async () => {
  // Prefer a local system mongod when available (fast for local dev).
  // In CI (no system mongod) fall back to a known downloadable binary version.
  const systemPath = '/usr/bin/mongod';
  if (fs.existsSync(systemPath)) {
    try {
      mongoServer = await MongoMemoryServer.create({
        binary: { systemBinary: systemPath },
      });
      await mongoose.connect(mongoServer.getUri());
      return;
    } catch (e) {
      // fall through to download-based creation
    }
  }

  // On CI some platforms choose an unsupported platform/version combination
  // when auto-selecting a binary. Pin a widely available server version.
  const ciBinaryVersion = '6.0.14';
  mongoServer = await MongoMemoryServer.create({ binary: { version: ciBinaryVersion } });
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
