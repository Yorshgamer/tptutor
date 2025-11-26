/**
 * __tests__/readingActivity.controller.test.js
 * Cobertura Objetivo: 100%
 */

import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================
// Mockeamos el modelo Mongoose
jest.mock("../models/ReadingActivity.js", () => {
  return {
    ReadingActivity: {
      create: jest.fn(),
      find: jest.fn(),
    },
  };
});

// Helper para silenciar logs de error durante los tests
const suppressLogs = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

// ==========================================
// 2. VARIABLES GLOBALES
// ==========================================
let ReadingActivity;
let createReadingActivity;
let listReadingActivities;
let req, res;

describe("📚 readingActivityController", () => {
  
  // Carga dinámica de módulos ESM
  beforeAll(async () => {
    const modelMod = await import("../models/ReadingActivity.js");
    ReadingActivity = modelMod.ReadingActivity;

    const ctrlMod = await import("../controllers/readingActivityController.js");
    createReadingActivity = ctrlMod.createReadingActivity;
    listReadingActivities = ctrlMod.listReadingActivities;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reseteamos req y res básicos
    req = { body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // =================================================================
  // A. CREATE ACTIVITY TESTS
  // =================================================================
  describe("createReadingActivity", () => {
    test("✅ Crea actividad correctamente (Happy Path)", async () => {
      // Input válido
      req.body = {
        projectId: "proj_123",
        activityId: "act_ABC",
        title: "Lectura 1",
        minScore: 16
      };

      // Mock de respuesta de DB
      const mockSaved = { ...req.body, _id: "act_ABC" };
      ReadingActivity.create.mockResolvedValue(mockSaved);

      await createReadingActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        data: mockSaved,
      });
      // Verificamos que se usó el activityId como _id
      expect(ReadingActivity.create).toHaveBeenCalledWith(expect.objectContaining({
        _id: "act_ABC",
        minScore: 16
      }));
    });

    test("🔥 Branch: Usa default minScore (14) si no viene en body", async () => {
      req.body = {
        projectId: "proj_123",
        activityId: "act_DEF",
        title: "Lectura 2",
        // minScore omitido
      };

      ReadingActivity.create.mockResolvedValue({ _id: "act_DEF" });

      await createReadingActivity(req, res);

      // Verificamos el fallback ?? 14
      expect(ReadingActivity.create).toHaveBeenCalledWith(expect.objectContaining({
        minScore: 14
      }));
    });

    test("🚫 Error de Validación Zod (400)", async () => {
      const consoleSpy = suppressLogs();
      // Falta projectId y activityId
      req.body = { title: "Incompleta" };

      await createReadingActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "VALIDATION"
      }));
      consoleSpy.mockRestore();
    });

    test("💥 Error Genérico de Base de Datos (500)", async () => {
      const consoleSpy = suppressLogs();
      req.body = { projectId: "p", activityId: "a", title: "t" };
      
      // Simulamos fallo en Mongoose
      ReadingActivity.create.mockRejectedValue(new Error("DB Down"));

      await createReadingActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: "SERVER"
      }));
      consoleSpy.mockRestore();
    });
  });

  // =================================================================
  // B. LIST ACTIVITY TESTS
  // =================================================================
  describe("listReadingActivities", () => {
    test("✅ Lista filtrando por projectId (Happy Path)", async () => {
      req.query = { projectId: "proj_1" };
      
      // Mock de cadena: find().lean()
      const mockLean = jest.fn().mockResolvedValue([{ title: "Act 1" }]);
      ReadingActivity.find.mockReturnValue({ lean: mockLean });

      await listReadingActivities(req, res);

      expect(ReadingActivity.find).toHaveBeenCalledWith({ projectId: "proj_1" });
      expect(mockLean).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: [{ title: "Act 1" }] });
    });

    test("🔥 Branch: Lista todo si no hay projectId en query", async () => {
      req.query = {}; // Sin filtro

      const mockLean = jest.fn().mockResolvedValue([]);
      ReadingActivity.find.mockReturnValue({ lean: mockLean });

      await listReadingActivities(req, res);

      // Verificamos que filter es {}
      expect(ReadingActivity.find).toHaveBeenCalledWith({}); 
      expect(res.json).toHaveBeenCalledWith({ ok: true, data: [] });
    });

    test("💥 Error Genérico al listar (500)", async () => {
      const consoleSpy = suppressLogs();
      
      // Hacemos que find lance error directamente
      ReadingActivity.find.mockImplementation(() => { throw new Error("DB Fail"); });

      await listReadingActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "SERVER" }));
      consoleSpy.mockRestore();
    });
  });
});