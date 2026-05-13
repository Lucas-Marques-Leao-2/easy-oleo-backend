import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "node",
  testRegex: "tests/.*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      { diagnostics: false, tsconfig: "tsconfig.json" },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts", "!src/**/*.module.ts"],
};

export default config;
