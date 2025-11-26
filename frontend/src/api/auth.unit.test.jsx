// src/api/auth.unit.test.jsx
import { registerUser, loginUser, fetchMe } from './auth'; // Importamos desde el mismo directorio

describe('src/api/auth.js', () => {
  const originalFetch = global.fetch;
  const originalLocalStorage = global.localStorage;

  // Mock de localStorage más robusto para JSDOM
  const mockLocalStorage = (() => {
    let store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
    };
  })();

  beforeAll(() => {
    // Reemplazamos localStorage globalmente
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Mock default de fetch (Happy Path)
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success' }),
      })
    );
  });

  afterAll(() => {
    global.fetch = originalFetch;
    // Restaurar localStorage si fuera necesario, aunque en JSDOM se reinicia
  });

  // --- TEST DE LOGICA DE TOKEN (HEADERS) ---
  describe('Headers & Authorization', () => {
    test('debe enviar el request SIN header Authorization si no hay token', async () => {
      await fetchMe();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }) // Verifica que NO tenga Authorization implícitamente o explícitamente
        })
      );
      
      // Verificación extra fuerte
      const callHeaders = global.fetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Authorization');
    });

    test('debe enviar el header Authorization Bearer si existe token', async () => {
      mockLocalStorage.setItem('token', 'TOKEN_FALSO_123');
      
      await fetchMe();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer TOKEN_FALSO_123'
          })
        })
      );
    });
  });

  // --- TEST DE ENDPOINTS (FUNCIONES EXPORTADAS) ---
  describe('Endpoints', () => {
    test('registerUser: debe llamar al endpoint correcto con POST', async () => {
      const userData = { name: 'Luis', email: 'luis@test.com', password: '123' };
      
      await registerUser(userData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ...userData, role: 'student' }) // Verifica el default role
        })
      );
    });

    test('loginUser: debe llamar al endpoint correcto con POST', async () => {
      const creds = { email: 'luis@test.com', password: '123' };
      
      await loginUser(creds);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(creds)
        })
      );
    });
  });

  // --- TEST DE MANEJO DE ERRORES (BRANCHES) ---
  describe('Error Handling', () => {
    test('Debe lanzar error con mensaje del backend si res.ok es false', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Credenciales inválidas' })
      });

      await expect(loginUser({ email: 'x', password: 'y' }))
        .rejects.toThrow('Credenciales inválidas');
    });

    test('Debe lanzar error genérico HTTP_STATUS si no hay mensaje de error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}) // JSON vacío
      });

      await expect(fetchMe()).rejects.toThrow('HTTP_500');
    });

    test('Debe manejar fallo al parsear JSON (catch del .json())', async () => {
      // Cubre la línea: .catch(() => ({}))
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('Error de red o JSON inválido'))
      });

      // Al fallar json(), devuelve {}, entra al if (!res.ok) y lanza HTTP_503
      await expect(fetchMe()).rejects.toThrow('HTTP_503');
    });

    test('Debe lanzar error si json.ok es false (Lógica de negocio)', async () => {
      // Cubre la rama: || json.ok === false
      global.fetch.mockResolvedValueOnce({
        ok: true, // HTTP 200
        json: async () => ({ ok: false, error: 'Usuario bloqueado' })
      });

      await expect(fetchMe()).rejects.toThrow('Usuario bloqueado');
    });
  });
});