/**
 * __tests__/authRoutes.test.js
 * Cobertura Esperada: 100%
 */

import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

// ==========================================
// 1. DEFINICIÓN DE MOCKS (Se Hoistean)
// ==========================================

// Mock: User model
jest.mock("../models/User.js", () => {
  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      hashPassword: jest.fn(),
    },
  };
});

// Mock: jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
  __esModule: true, // Ayuda a Jest a entender que es un módulo ES
  sign: jest.fn(),
  verify: jest.fn(),
}));

// ==========================================
// 2. VARIABLES GLOBALES DEL TEST
// ==========================================
let User;
let jwt;
let authRouter;
let app;

// Función auxiliar para silenciar logs
const suppressLogs = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

describe("🛡️ Auth Routes & Logic", () => {
  
  // ==========================================
  // 3. CARGA DINÁMICA (SOLUCIÓN AL ERROR TLA)
  // ==========================================
  beforeAll(async () => {
    // Importamos los módulos AQUÍ dentro, donde el await es legal
    const userModule = await import("../models/User.js");
    User = userModule.User;

    const jwtModule = await import("jsonwebtoken");
    jwt = jwtModule.default;

    const routeModule = await import("../routes/authRoutes.js");
    authRouter = routeModule.default;

    // Inicializamos la app una sola vez o en beforeEach según prefieras
    // Aquí la definimos genérica, pero la montamos en beforeEach para limpiar
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuramos variables de entorno críticas
    process.env.JWT_SECRET = "testsecret";
    process.env.JWT_EXPIRES_IN = "1h";

    // Re-creamos la app para asegurar limpieza de estado en router (opcional pero seguro)
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
  });

  // =================================================================
  // 1. REGISTER TESTS
  // =================================================================
  describe("POST /register", () => {
    test("✅ Crea usuario y devuelve token (Happy Path)", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({
        _id: "u1",
        email: "test@test.com",
        name: "Test",
        role: "student",
      });
      jwt.sign.mockReturnValue("mocked_token");

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@test.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.token).toBe("mocked_token");
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
    });

    test("⚖️ Normaliza roles y maneja mayúsculas (TEACHER -> teacher)", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("h");
      User.create.mockResolvedValue({ _id: "u2", role: "teacher" });
      jwt.sign.mockReturnValue("t");

      await request(app).post("/api/auth/register").send({
        name: "Profe",
        email: "p@p.com",
        password: "password123",
        role: "TEACHER",
      });

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: "teacher" }));
    });

    test("🚫 Falla validación Zod (Password corto)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Bad",
        email: "bad@mail.com",
        password: "123",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("VALIDATION");
    });

    test("🚫 Email ya existe (409)", async () => {
      User.findOne.mockResolvedValue({ _id: "existente" });
      const res = await request(app).post("/api/auth/register").send({
        name: "X",
        email: "used@mail.com",
        password: "password123",
      });
      expect(res.status).toBe(409);
    });

    test("💥 ROLLBACK: Si falla firma del token, borra el usuario creado", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("h");
      User.create.mockResolvedValue({ _id: "user_fail_token", role: "student" });
      
      jwt.sign.mockImplementation(() => { throw new Error("Fallo firma"); });

      const res = await request(app).post("/api/auth/register").send({
        name: "Rollback",
        email: "r@mail.com",
        password: "password123",
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("SERVER_TOKEN");
      expect(User.findByIdAndDelete).toHaveBeenCalledWith("user_fail_token");
    });

    test("🔥 Error Genérico del Servidor (catch externo)", async () => {
        const consoleSpy = suppressLogs();
        User.findOne.mockRejectedValue(new Error("DB Down"));

        const res = await request(app).post("/api/auth/register").send({
            name: "Error", email: "e@e.com", password: "password123"
        });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("SERVER");
        consoleSpy.mockRestore();
    });
  });

  // =================================================================
  // 2. LOGIN TESTS
  // =================================================================
  describe("POST /login", () => {
    test("✅ Login exitoso", async () => {
      const userMock = {
        _id: "u1",
        email: "valid@mail.com",
        role: "student",
        checkPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(userMock);
      jwt.sign.mockReturnValue("token_login");

      const res = await request(app).post("/api/auth/login").send({
        email: "valid@mail.com",
        password: "correct_password",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBe("token_login");
    });

    test("🚫 Credenciales inválidas (Usuario no existe)", async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post("/api/auth/login").send({
        email: "noone@mail.com", password: "pw"
      });
      expect(res.status).toBe(401);
    });

    test("🚫 Credenciales inválidas (Password incorrecto)", async () => {
      const userMock = {
        checkPassword: jest.fn().mockResolvedValue(false),
      };
      User.findOne.mockResolvedValue(userMock);
      
      const res = await request(app).post("/api/auth/login").send({
        email: "exists@mail.com", password: "wrong"
      });
      expect(res.status).toBe(401);
    });

    test("🚫 Validación Zod Login", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "not-an-email", password: "" 
        });
        expect(res.status).toBe(400);
    });

    test("🔥 Error Genérico Login", async () => {
        const consoleSpy = suppressLogs();
        User.findOne.mockRejectedValue(new Error("Boom"));
        const res = await request(app).post("/api/auth/login").send({
            email: "a@b.com", password: "p"
        });
        expect(res.status).toBe(500);
        consoleSpy.mockRestore();
    });
  });

  // =================================================================
  // 3. AUTH MIDDLEWARE & /me TESTS
  // =================================================================
  describe("GET /me (Auth Middleware)", () => {
    test("✅ Acceso permitido con token válido", async () => {
        jwt.verify.mockReturnValue({ sub: "u1", role: "student" });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: "u1", email: "me@me.com" })
        });

        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer valid_token");

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe("me@me.com");
    });

    test("🚫 Sin Header Authorization -> 401", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("NO_TOKEN");
    });

    test("🚫 Header mal formado (sin 'Bearer') -> 401", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Basic 123456");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("NO_TOKEN");
    });

    test("🚫 Token inválido/expirado (verify lanza error) -> 401", async () => {
        jwt.verify.mockImplementation(() => { throw new Error("Expired"); });
        
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer bad_token");
        
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("INVALID_TOKEN");
    });
  });

  // =================================================================
  // 4. SIGN TOKEN EDGE CASES
  // =================================================================
  describe("🔐 signToken Helper internals", () => {
    test("💥 Lanza error si no existe JWT_SECRET en process.env", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const consoleSpy = suppressLogs();
      
      User.findOne.mockResolvedValue({ 
          checkPassword: jest.fn().mockResolvedValue(true),
          _id: "u1", role: "s"
      });
      // Importante: mockear jwt.sign para que NO falle él, sino el check de env
      jwt.sign.mockReturnValue("token");

      const res = await request(app).post("/api/auth/login").send({
          email: "env@test.com", password: "pass"
      });

      expect(res.status).toBe(500);

      process.env.JWT_SECRET = originalSecret;
      consoleSpy.mockRestore();
    });
  });
});