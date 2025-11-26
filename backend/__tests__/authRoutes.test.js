/**
 * __tests__/authRoutes.test.js
 * Cobertura Objetivo: 100% ABSOLUTO
 */

import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================
jest.mock("../models/User.js", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    hashPassword: jest.fn(),
  },
}));

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
// 2. CONFIGURACIÓN GLOBAL
// ==========================================
let User;
let jwt;
let authRouter;
let app;

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
    
    // 🔥 CLAVE: Usamos valores DIFERENTES a los fallbacks del código
    // Código fallback: "1h". Aquí: "2h".
    // Código fallback: 12. Aquí: 10.
    process.env.JWT_SECRET = "testsecret";
    process.env.JWT_EXPIRES_IN = "2h"; 
    process.env.BCRYPT_ROUNDS = "10"; 

    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
  });

  // =================================================================
  // 1. REGISTER TESTS
  // =================================================================
  describe("POST /register", () => {
    test("✅ Crea usuario y devuelve token (Happy Path - Usa ENV)", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({ _id: "u1", email: "test@test.com", role: "student" });
      jwt.sign.mockReturnValue("token");

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User", email: "test@test.com", password: "password123"
      });
      expect(res.status).toBe(201);
      
      // Verificamos que se usó el valor del entorno ("2h") y NO el fallback
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(), expect.anything(), expect.objectContaining({ expiresIn: "2h" })
      );
      // Verificamos que se usó el valor del entorno (10) y NO el fallback
      expect(User.hashPassword).toHaveBeenCalledWith("password123", 10);
    });

    test("⚖️ Normaliza roles y maneja mayúsculas", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({ _id: "u2", role: "teacher" });
      jwt.sign.mockReturnValue("t");

      await request(app).post("/api/auth/register").send({
        name: "Profe", email: "p@p.com", password: "password123", role: "TEACHER"
      });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: "teacher" }));
    });

    test("🔥 NEW: Ignora role si no es string (cubre branch typeof !== string)", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({ _id: "u3", role: "student" });
      jwt.sign.mockReturnValue("t");

      await request(app).post("/api/auth/register").send({
        name: "NumRole", email: "n@n.com", password: "password123", role: 12345
      });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }));
    });

    // --- TESTS DE ENTORNO ---

    test("🔥 ENV: Usa fallback '1h' (Línea 24) si variable vacía", async () => {
      process.env.JWT_EXPIRES_IN = ""; // Vacío -> Falsy
      
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("hashed");
      User.create.mockResolvedValue({ _id: "u_env", role: "student" });
      jwt.sign.mockReturnValue("token_default");

      await request(app).post("/api/auth/register").send({
        name: "Env", email: "e@t.com", password: "password123"
      });
      
      // Debe usar fallback "1h"
      expect(jwt.sign).toHaveBeenCalledWith(
          expect.anything(), 
          expect.anything(), 
          expect.objectContaining({ expiresIn: "1h" })
      );
    });

    test("🔥 ENV: Usa fallback BCRYPT 12 (Línea 63) si variable vacía", async () => {
        process.env.BCRYPT_ROUNDS = ""; // Vacío -> Falsy

        User.findOne.mockResolvedValue(null);
        User.hashPassword.mockResolvedValue("hashed_default");
        User.create.mockResolvedValue({ _id: "u_bcrypt", role: "student" });
        jwt.sign.mockReturnValue("token");

        await request(app).post("/api/auth/register").send({
            name: "BcryptTest", email: "b@t.com", password: "password123"
        });

        // Debe usar fallback 12
        expect(User.hashPassword).toHaveBeenCalledWith("password123", 12);
    });

    test("🔥 HARDCORE I: Cubrir branch 'req.body undefined'", async () => {
      const rawApp = express();
      rawApp.use("/api/auth", authRouter);
      const res = await request(rawApp).post("/api/auth/register");
      expect(res.status).toBe(400);
    });

    test("🔥 HARDCORE II: Cubrir branch 'req.body null'", async () => {
      const rawApp = express();
      rawApp.use(express.json());
      rawApp.use((req, res, next) => { req.body = null; next(); });
      rawApp.use("/api/auth", authRouter);
      const res = await request(rawApp).post("/api/auth/register");
      expect(res.status).toBe(400);
    });

    test("🚫 Falla validación Zod (Password corto)", async () => {
      const res = await request(app).post("/api/auth/register").send({ password: "123" });
      expect(res.status).toBe(400);
    });

    test("🚫 Email ya existe", async () => {
      User.findOne.mockResolvedValue({ _id: "existente" });
      const res = await request(app).post("/api/auth/register").send({
        name: "UserX", email: "used@mail.com", password: "password123"
      });
      expect(res.status).toBe(409);
    });

    test("💥 ROLLBACK: Si falla firma del token", async () => {
      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue("h");
      User.create.mockResolvedValue({ _id: "del", role: "s" });
      
      jwt.sign.mockImplementation(() => { throw new Error("Fallo"); });

      const res = await request(app).post("/api/auth/register").send({
        name: "RollbackUser", 
        email: "r@m.com", 
        password: "password123"
      });
      
      expect(res.status).toBe(500);
      expect(User.findByIdAndDelete).toHaveBeenCalled();
    });

    test("🔥 Error Genérico del Servidor", async () => {
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
      User.findOne.mockResolvedValue({ checkPassword: jest.fn().mockResolvedValue(true), _id: "u", role: "s" });
      jwt.sign.mockReturnValue("token");
      const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "p" });
      expect(res.status).toBe(200);
    });

    test("🔥 NEW: signToken usa fallback '1h' (Check desde Login)", async () => {
        process.env.JWT_EXPIRES_IN = ""; 
        User.findOne.mockResolvedValue({ checkPassword: jest.fn().mockResolvedValue(true), _id: "u", role: "s" });
        await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "p" });
        expect(jwt.sign).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ expiresIn: "1h" }));
    });

    test("🔥 NEW: Cubrir rama 'err.issues' en Login", async () => {
      const consoleSpy = suppressLogs();
      User.findOne.mockImplementation(() => { throw { issues: ["zod"] }; });
      const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "p" });
      expect(res.status).toBe(400);
      consoleSpy.mockRestore();
    });

    test("🚫 Credenciales inválidas (No user)", async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "p" });
      expect(res.status).toBe(401);
    });

    test("🚫 Credenciales inválidas (Bad pass)", async () => {
      User.findOne.mockResolvedValue({ checkPassword: jest.fn().mockResolvedValue(false) });
      const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "p" });
      expect(res.status).toBe(401);
    });

    test("🔥 Error Genérico Login", async () => {
        const consoleSpy = suppressLogs();
        User.findOne.mockRejectedValue(new Error("Boom"));
        const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "p" });
        expect(res.status).toBe(500);
        consoleSpy.mockRestore();
    });
  });

  // =================================================================
  // 3. UTILS & MIDDLEWARE
  // =================================================================
  describe("GET /me & Utils", () => {
    test("✅ Acceso permitido", async () => {
        jwt.verify.mockReturnValue({ sub: "u1", role: "student" });
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: "u1" }) });
        const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer valid");
        expect(res.status).toBe(200);
    });

    test("🚫 Sin Header", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    test("🚫 Token inválido", async () => {
        jwt.verify.mockImplementation(() => { throw new Error("Expired"); });
        const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer bad");
        expect(res.status).toBe(401);
    });

    test("💥 signToken: Lanza error si falta JWT_SECRET", async () => {
      delete process.env.JWT_SECRET;
      const consoleSpy = suppressLogs();
      User.findOne.mockResolvedValue({ checkPassword: jest.fn().mockResolvedValue(true) });
      const res = await request(app).post("/api/auth/login").send({ email: "e@t.com", password: "p" });
      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});