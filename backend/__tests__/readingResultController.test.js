/**
 * __tests__/readingResult.controller.test.js
 * Cobertura Objetivo: 100% Statements, Branches, Functions, Lines
 */

import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================

// Mock de Modelos Mongoose
jest.mock("../models/Project.js", () => ({
  Project: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock("../models/ReadingActivity.js", () => ({
  ReadingActivity: {
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock("../models/ReadingResult.js", () => ({
  ReadingResult: {
    create: jest.fn(),
    distinct: jest.fn(),
  },
}));

jest.mock("../models/User.js", () => ({
  User: {
    findById: jest.fn(),
  },
}));

// Mock de n8n (External Service)
jest.mock("../utils/n8nClient.js", () => ({
  notifyReadingCompleted: jest.fn(),
}));

// Helper logs
const suppressLogs = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

// ==========================================
// 2. VARIABLES GLOBALES
// ==========================================
let createReadingResult;
let Project, ReadingActivity, ReadingResult, User, n8nClient;
let req, res;

describe("📊 readingResultController", () => {
  beforeAll(async () => {
    // Import dinámico de modelos y utilidades mockeadas
    const projectMod = await import("../models/Project.js");
    Project = projectMod.Project;

    const activityMod = await import("../models/ReadingActivity.js");
    ReadingActivity = activityMod.ReadingActivity;

    const resultMod = await import("../models/ReadingResult.js");
    ReadingResult = resultMod.ReadingResult;

    const userMod = await import("../models/User.js");
    User = userMod.User;

    n8nClient = await import("../utils/n8nClient.js");

    // Import del controlador bajo prueba
    const ctrlMod = await import("../controllers/readingResultController.js");
    createReadingResult = ctrlMod.createReadingResult;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup básico de Request/Response
    req = {
      body: {
        projectId: "proj_1",
        activityId: "act_1",
        mcScore: 10,
        openScore: 10,
        rawText: "Texto lectura",
      },
      user: { id: "student_1" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // ==========================================
  // TESTS DE VALIDACIÓN Y ACCESO
  // ==========================================

  test("🚫 400 si falla validación Zod (Input inválido)", async () => {
    const consoleSpy = suppressLogs();
    req.body.mcScore = -5; // Inválido (min 0)

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "VALIDATION" }));
    consoleSpy.mockRestore();
  });

  test("🚫 404 si el proyecto no existe", async () => {
    Project.findById.mockResolvedValue(null);

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "PROJECT_NOT_FOUND" }));
  });

  test("🚫 403 si el usuario no es el dueño del proyecto", async () => {
    Project.findById.mockResolvedValue({ 
      _id: "proj_1", 
      ownerId: { toString: () => "other_student" } // Diferente a req.user.id
    });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({}) });

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "FORBIDDEN_PROJECT" }));
  });

  // ==========================================
  // TESTS DE LÓGICA DE NEGOCIO (Happy Paths)
  // ==========================================

  test("✅ Crea resultado APROBADO, crea actividad nueva y NOTIFICA a n8n", async () => {
    // 1. Setup Data
    const projectMock = { _id: "proj_1", ownerId: { toString: () => "student_1" } };
    const userMock = { _id: "student_1", name: "Juan" };
    
    // Mocks iniciales
    Project.findById.mockResolvedValue(projectMock);
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(userMock) });

    // 2. Simulamos que la actividad NO existe (null) -> debe crearla
    ReadingActivity.findById.mockResolvedValue(null);
    ReadingActivity.create.mockResolvedValue({ _id: "act_1", minScore: 14 });

    // 3. Simulamos creación de resultado
    // Nota: mcScore 15 + openScore 15 = 30 / 2 = 15 (>= 14 Aprobado)
    req.body.mcScore = 15;
    req.body.openScore = 15;
    
    ReadingResult.create.mockImplementation((data) => Promise.resolve({ ...data, _id: "res_1" }));

    // 4. Simulamos recálculo de progreso
    ReadingActivity.countDocuments.mockResolvedValue(10); // Total
    ReadingResult.distinct.mockResolvedValue(["act_1", "act_2"]); // 2 completadas

    // EJECUCIÓN
    await createReadingResult(req, res);

    // ASERCIONES
    
    // a) Creación dinámica de actividad
    expect(ReadingActivity.create).toHaveBeenCalledWith(expect.objectContaining({
      _id: "act_1",
      minScore: 14 // default
    }));

    // b) Creación de resultado con Passed = true
    expect(ReadingResult.create).toHaveBeenCalledWith(expect.objectContaining({
      passed: true,
      totalScore: 15
    }));

    // c) Recálculo de progreso
    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith("proj_1", {
      totalActivities: 10,
      completedActivities: 2,
      progressPercent: 20 // (2/10)*100
    });

    // d) Notificación n8n (Branch passed=true)
    expect(n8nClient.notifyReadingCompleted).toHaveBeenCalledWith(expect.objectContaining({
      result: expect.objectContaining({ passed: true })
    }));

    // e) Respuesta final
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("✅ Crea resultado REPROBADO, usa actividad existente y NO notifica", async () => {
    // Setup
    Project.findById.mockResolvedValue({ _id: "proj_1", ownerId: { toString: () => "student_1" } });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({}) });

    // Actividad EXISTE (minScore custom 18)
    ReadingActivity.findById.mockResolvedValue({ _id: "act_1", minScore: 18 });

    // Scores bajos: (10 + 10) / 2 = 10 (< 18 Reprobado)
    req.body.mcScore = 10;
    req.body.openScore = 10;

    ReadingResult.create.mockImplementation((data) => Promise.resolve({ ...data }));
    
    // Progreso mocks
    ReadingActivity.countDocuments.mockResolvedValue(5);
    ReadingResult.distinct.mockResolvedValue(["act_X"]);

    await createReadingResult(req, res);

    // Aserciones
    expect(ReadingActivity.create).not.toHaveBeenCalled(); // Ya existía
    expect(ReadingResult.create).toHaveBeenCalledWith(expect.objectContaining({
      passed: false, // Reprobado
      totalScore: 10
    }));
    
    // NO debe notificar a n8n
    expect(n8nClient.notifyReadingCompleted).not.toHaveBeenCalled(); 
  });

  // ==========================================
  // EDGE CASES & BRANCH COVERAGE
  // ==========================================

  test("🔥 Branch: Evita división por cero en progreso (totalActivities = 0)", async () => {
    Project.findById.mockResolvedValue({ _id: "proj_1", ownerId: { toString: () => "student_1" } });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({}) });
    ReadingActivity.findById.mockResolvedValue({ minScore: 14 });
    ReadingResult.create.mockResolvedValue({});

    // Simulamos que countDocuments devuelve 0 (Branch coverage crítico)
    ReadingActivity.countDocuments.mockResolvedValue(0);
    ReadingResult.distinct.mockResolvedValue([]);

    await createReadingResult(req, res);

    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith("proj_1", {
      totalActivities: 0,
      completedActivities: 0,
      progressPercent: 0 // Branch else ejecutada
    });
  });

  test("🔥 Branch: Usa fallback minScore 14 si actividad no lo tiene", async () => {
    Project.findById.mockResolvedValue({ _id: "proj_1", ownerId: { toString: () => "student_1" } });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({}) });
    
    // Actividad existe pero minScore es undefined/null
    ReadingActivity.findById.mockResolvedValue({ _id: "act_1", minScore: undefined });
    
    req.body.mcScore = 14; 
    req.body.openScore = 14; // Promedio 14

    await createReadingResult(req, res);

    // Debería usar 14 por defecto y pasar
    expect(ReadingResult.create).toHaveBeenCalledWith(expect.objectContaining({
      passed: true
    }));
  });

  test("💥 Error Interno (Catch global)", async () => {
    const consoleSpy = suppressLogs();
    Project.findById.mockRejectedValue(new Error("DB Explosion"));

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "SERVER" }));
    consoleSpy.mockRestore();
  });
});