/**
 * __tests__/readingResult.routes.test.js
 * Cobertura Objetivo: 100% Wiring
 */

import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================

// Mock del Controlador
jest.mock("../controllers/readingResultController.js", () => ({
  createReadingResult: jest.fn((req, res) => res.status(201).json({ mock: "result_created" })),
}));

// Mock Auth Middleware
jest.mock("../routes/authRoutes.js", () => ({
  auth: jest.fn((req, res, next) => next()),
}));

// ==========================================
// 2. SETUP
// ==========================================
let resultRoutes;
let resultControllerMock;
let app;

describe("🚀 /api/reading-results Routes", () => {
  beforeAll(async () => {
    const routeMod = await import("../routes/readingResultRoutes.js");
    resultRoutes = routeMod.default;

    const ctrlMod = await import("../controllers/readingResultController.js");
    resultControllerMock = ctrlMod.createReadingResult;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/reading-results", resultRoutes);
  });

  test("✅ POST / -> createReadingResult", async () => {
    const res = await request(app)
      .post("/api/reading-results")
      .send({ projectId: "123", rawText: "test" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ mock: "result_created" });
    
    // Verificar que el router delegó al controlador
    expect(resultControllerMock).toHaveBeenCalled();
  });
});