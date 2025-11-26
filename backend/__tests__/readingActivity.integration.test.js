/**
 * __tests__/readingActivity.routes.test.js
 * Cobertura Objetivo: 100% (Wiring)
 */

import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================

// Mock del Controlador (Logica ya testeada en unit test)
jest.mock("../controllers/readingActivityController.js", () => ({
  createReadingActivity: jest.fn((req, res) => res.status(201).json({ mock: "created" })),
  listReadingActivities: jest.fn((req, res) => res.status(200).json({ mock: "listed" })),
}));

// Mock del Middleware de Auth (Para aislar la ruta de la lógica de JWT)
jest.mock("../routes/authRoutes.js", () => ({
  auth: jest.fn((req, res, next) => next()), // Bypass auth
}));

// ==========================================
// 2. SETUP
// ==========================================
let readingRoutes;
let readingController;
let app;

describe("🚀 /api/reading-activities Routes", () => {
  beforeAll(async () => {
    // Import dinámico
    const routeMod = await import("../routes/readingActivityRoutes.js");
    readingRoutes = routeMod.default;

    const ctrlMod = await import("../controllers/readingActivityController.js");
    readingController = ctrlMod;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/reading-activities", readingRoutes);
  });

  test("✅ POST / -> createReadingActivity", async () => {
    const res = await request(app)
      .post("/api/reading-activities")
      .send({ title: "Test" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ mock: "created" });
    // Verificamos conexión
    expect(readingController.createReadingActivity).toHaveBeenCalled();
  });

  test("✅ GET / -> listReadingActivities", async () => {
    const res = await request(app).get("/api/reading-activities");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ mock: "listed" });
    // Verificamos conexión
    expect(readingController.listReadingActivities).toHaveBeenCalled();
  });
});