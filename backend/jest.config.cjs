module.exports = {
    testEnvironment: "node",
    transform: {
        "^.+\\.js$": ["babel-jest", { presets: ["@babel/preset-env"] }],
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // 👈 agrega esta línea
    collectCoverage: true,
    collectCoverageFrom: [
        "controllers/**/*.js",
        "routes/**/*.js",
        "utils/**/*.js",
        "!index.js"
    ],
    coverageReporters: ["text", "lcov", "json-summary"],
    coverageThreshold: {
        global: {
            statements: 60,
            branches: 50,
            functions: 60,
            lines: 60,
        },
    },
};
