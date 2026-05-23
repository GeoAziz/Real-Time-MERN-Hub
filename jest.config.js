export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  moduleDirectories: ['node_modules', '<rootDir>/client/node_modules'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg|mp3|mp4)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
};
