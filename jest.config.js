import fs from 'fs';
import path from 'path';

const moduleNameMapper = {
  '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
  '\\.(jpg|jpeg|png|gif|webp|svg|mp3|mp4)$': '<rootDir>/tests/__mocks__/fileMock.js',
};

// If the client has its own node_modules installed, force Jest to resolve
// `react` and `react-dom` to the client copy to avoid duplicate React copies
// when running tests from the repository root (this is important in CI).
const clientReactPath = path.join(process.cwd(), 'client', 'node_modules', 'react');
const clientReactDomPath = path.join(process.cwd(), 'client', 'node_modules', 'react-dom');
if (fs.existsSync(clientReactPath) && fs.existsSync(clientReactDomPath)) {
  moduleNameMapper['^react$'] = '<rootDir>/client/node_modules/react';
  moduleNameMapper['^react-dom$'] = '<rootDir>/client/node_modules/react-dom';
}

export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  moduleDirectories: ['node_modules', '<rootDir>/client/node_modules'],
  moduleNameMapper,
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
};
