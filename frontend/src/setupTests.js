/* istanbul ignore file */
// src/setupTests.js
import '@testing-library/jest-dom';

// Mockeamos el módulo que rompe por `import.meta`
jest.mock('./api/auth', () => ({
  registerUser: jest.fn(async ({ name, email, password, role = 'student' }) => {
    // Simulamos respuesta "bonita" para los tests
    return {
      ok: true,
      data: {
        id: 'test-id',
        name,
        email,
        role,
      },
    };
  }),

  loginUser: jest.fn(async ({ email }) => {
    return {
      ok: true,
      data: {
        token: 'fake-token',
        user: {
          id: 'test-id',
          email,
          name: 'Test User',
        },
      },
    };
  }),

  fetchMe: jest.fn(async () => {
    return {
      ok: true,
      data: {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };
  }),
}));
