// jest.config.cjs
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  testTimeout: 30000, // 30 segundos por test

  // Transforma TS/JS/JSX/TSX con Babel (como ya lo tenías)
  transform: {
    "^.+\\.[tj]sx?$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript"
      ]
    }]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],

  // Soporte para importar estilos en componentes (evita crasheos de CSS Modules)
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },

  // Cobertura
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!src/main.{ts,tsx,js,jsx}", // excluye el bootstrap de Vite/React
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"],

  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3000'
      }
    }
  }
};