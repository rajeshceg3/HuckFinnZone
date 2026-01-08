module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/unit/**/*.test.js', '**/tests/integration/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/data.js',
  ],
  coverageThreshold: {
    './js/engine.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './js/analytics.js': {
      branches: 60,
      functions: 90,
      lines: 80,
      statements: 80,
    },
    './js/intel.js': {
      branches: 90,
      functions: 80,
      lines: 90,
      statements: 90,
    }
  }
};
