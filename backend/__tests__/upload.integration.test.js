/**
 * __tests__/upload.routes.test.js
 * Cobertura Objetivo: 100% (Wiring & Middleware simulation)
 */

import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================

// Mock del Controlador
jest.mock("../controllers/uploadController.js", () => ({
  uploadFile: jest.fn((req, res) => res.status(200).json({ mock: "uploaded" })),
}));

// Mock de Multer (El Truco Maestro) 🎩
// Multer es una función que retorna un objeto con métodos como .single()
jest.mock("multer", () => {
  const multerMiddleware = (req, res, next) => {
    // Simulamos que multer procesó el archivo
    req.file = { originalname: "test.png", filename: "12345" }; 
    next();
  };

  const multerInstance = {
    // .single retorna un middleware de express
    single: jest.fn(() => multerMiddleware),
    array: jest.fn(() => multerMiddleware),
  };

  // El default export de multer es la función constructora
  return jest.fn(() => multerInstance);
});

// ==========================================
// 2. SETUP
// ==========================================
let uploadRoutes;
let uploadControllerMock;
let app;

describe("📂 /api/upload Routes", () => {
  beforeAll(async () => {
    const routeMod = await import("../routes/uploadRoutes.js");
    uploadRoutes = routeMod.default;

    const ctrlMod = await import("../controllers/uploadController.js");
    uploadControllerMock = ctrlMod.uploadFile;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/upload", uploadRoutes);
  });

  test("✅ POST / -> Pasa por Multer y llega a uploadFile", async () => {
    // No necesitamos .attach() real porque mockeamos multer para que deje pasar todo
    const res = await request(app).post("/api/upload");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ mock: "uploaded" });

    // Verificamos que el router conectó con el controlador
    expect(uploadControllerMock).toHaveBeenCalled();
  });

  test("🚫 GET / -> 404 (Método no permitido)", async () => {
    const res = await request(app).get("/api/upload");
    expect(res.statusCode).toBe(404);
  });
});