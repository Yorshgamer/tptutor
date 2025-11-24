/**
 * __tests__/authRoutes.test.js
 * Cobertura Esperada: 100% ABSOLUTO
 */

import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

// ==========================================
// 1. DEFINICIÓN DE MOCKS
// ==========================================
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

// Mock de jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
  __esModule: true,
  sign: jest.fn(),
  verify: jest.fn(),
}));

// ==========================================
// 2. VARIABLES GLOBALES
// ==========================================
let User;
let jwt;
let authRouter;
let app;

// Helper para silenciar logs
const suppressLogs = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

describe("🛡️ Auth Routes & Logic", () => {
  
  beforeAll(async () => {
    const userModule = await import("../models/User.js");
    User = userModule.User;

    const jwtModule = await import("jsonwebtoken");
    jwt = jwtModule.default;

    const routeModule = await import("../routes/authRoutes.js");
    authRouter = routeModule.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
    process.env.JWT_EXPIRES_IN = "1h";

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
    });

    test("⚖️ Normaliza roles y maneja mayúsculas (TEACHER -> teacher)", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
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

    test("🔥 NEW: Ignora role si no es string (cubre branch typeof !== string)", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({ _id: "u3", role: "student" });
      jwt.sign.mockReturnValue("t");

      await request(app).post("/api/auth/register").send({
        name: "NumRole", 
        email: "n@n.com", 
        password: "password123", // CORREGIDO: Largo válido para pasar Zod
        role: 12345 // Dispara el else del typeof
      });
      
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
    });

    test("🔥 NEW: Usa fallback '1h' en registro si no hay ENV (cubre línea 63)", async () => {
      delete process.env.JWT_EXPIRES_IN; 
      
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({ _id: "u_env", role: "student" });
      jwt.sign.mockReturnValue("token_default_time");

      await request(app).post("/api/auth/register").send({
        name: "EnvTest", 
        email: "env@test.com", 
        password: "password123" // CORREGIDO: Largo válido para pasar Zod
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(), 
        expect.anything(), 
        expect.objectContaining({ expiresIn: "1h" }) 
      );
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
        name: "UserX",
        email: "used@mail.com",
        password: "password123",
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("EMAIL_IN_USE");
    });

    test("💥 ROLLBACK: Si falla firma del token, borra el usuario creado", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
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

    test("🔥 NEW: signToken usa fallback '1h' (cubre línea 24 en helper)", async () => {
        delete process.env.JWT_EXPIRES_IN;
        
        User.findOne.mockResolvedValue({ 
            checkPassword: jest.fn().mockResolvedValue(true), _id: "u", role: "s" 
        });
        
        await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "password123" });

        expect(jwt.sign).toHaveBeenCalledWith(
            expect.anything(), expect.anything(), expect.objectContaining({ expiresIn: "1h" })
        );
    });

    test("🔥 NEW: Cubrir rama 'err.issues' en Login (cubre línea 107)", async () => {
      const consoleSpy = suppressLogs();
      User.findOne.mockImplementation(() => {
        const e = { issues: ["Error simulado tipo Zod"] }; 
        throw e;
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "a@a.com", password: "p"
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("VALIDATION");
      consoleSpy.mockRestore();
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
  // 3. MIDDLEWARE & UTILS TESTS
  // =================================================================
  describe("GET /me & Utils", () => {
    test("✅ Acceso permitido con token válido", async () => {
        jwt.verify.mockReturnValue({ sub: "u1", role: "student" });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: "u1", email: "me@me.com" })
        });

        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer valid_token");

        expect(res.status).toBe(200);
    });

    test("🚫 Sin Header Authorization -> 401", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    test("🚫 Token inválido -> 401", async () => {
        jwt.verify.mockImplementation(() => { throw new Error("Expired"); });
        const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer bad");
        expect(res.status).toBe(401);
    });

    test("💥 signToken: Lanza error si falta JWT_SECRET (Line Coverage)", async () => {
      delete process.env.JWT_SECRET;
      
      const consoleSpy = suppressLogs();
      User.findOne.mockResolvedValue({ 
          checkPassword: jest.fn().mockResolvedValue(true),
          _id: "u1", role: "s"
      });
      // No mockeamos jwt.sign para que falle signToken

      const res = await request(app).post("/api/auth/login").send({
          email: "env@test.com", password: "password123"
      });

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});