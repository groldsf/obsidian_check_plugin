/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // An array of file extensions your modules use
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",    
    "json",
    "node"
  ],

  preset: "ts-jest",

  testEnvironment: "node",

  // Limit the number of workers that run tests in parallel
  maxWorkers: 1, // <--- Задает последовательное выполнение

};

export default config;
