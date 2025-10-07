module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": ["babel-jest", { presets: ["@babel/preset-env"] }]
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js"
  ],
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  }
};
