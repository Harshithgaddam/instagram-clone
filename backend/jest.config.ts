import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',

  testRegex: '.*\\.spec\\.ts$',

  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.spec.json',
        useESM: true,
      },
    ],
  },

  testEnvironment: 'node',

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
  ],

  coverageDirectory: './coverage',
};

export default config;