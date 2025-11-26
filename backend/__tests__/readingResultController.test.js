/**
 * __tests__/readingResultController.test.js
 * Objetivo: Testear la lógica de guardar resultados de lectura y progreso.
 * Solución: Uso correcto de Mocks con ESM para evitar errores 500.
 */

import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS (Definidos Inline)
// ==========================================

// Mockeamos Project
jest.mock("../models/Project.js", () => ({
  Project: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

// Mockeamos ReadingActivity
jest.mock("../models/ReadingActivity.js", () => ({
  ReadingActivity: {
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

// Mockeamos ReadingResult
jest.mock("../models/ReadingResult.js", () => ({
  ReadingResult: {
    create: jest.fn(),
    distinct: jest.fn(),
  },
}));

// Mockeamos User (con soporte para chaining .select())
jest.mock("../models/User.js", () => ({
  User: {
    findById: jest.fn(),
  },
}));

// Mockeamos n8nClient
jest.mock("../utils/n8nClient.js", () => ({
  notifyReadingCompleted: jest.fn(),
}));

// ==========================================
// 2. IMPORTS (Para controlar los mocks)
// ==========================================
import { createReadingResult } from "../controllers/readingResultController.js";
import { Project } from "../models/Project.js";
import { ReadingActivity } from "../models/ReadingActivity.js";
import { ReadingResult } from "../models/ReadingResult.js";
import { User } from "../models/User.js";
import { notifyReadingCompleted } from "../utils/n8nClient.js";

// Helper para silenciar logs de error
const suppressLogs = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

describe("📊 Reading Result Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuración por defecto de User para permitir encadenamiento (.select)
    // Esto evita el crash cuando el controlador hace User.findById().select()
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "student_1", email: "test@test.com" }),
    });

    // Request por defecto (Válido)
    req = {
      body: {
        projectId: "proj_1",
        activityId: "act_1",
        mcScore: 10,
        openScore: 10,
        rawText: "Texto de prueba",
        reflection: "Reflexión opcional",
      },
      user: { id: "student_1" }, 
    };

    // Response Mock
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // ==========================================
  // BLOQUE 1: VALIDACIONES Y SEGURIDAD
  // ==========================================

  test("🚫 400 - Falla validación Zod (Score negativo)", async () => {
    const logSpy = suppressLogs();
    req.body.mcScore = -5; // Inválido

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "VALIDATION" }));
    logSpy.mockRestore();
  });

  test("🚫 404 - Proyecto no encontrado", async () => {
    // Simulamos que la DB no encuentra el proyecto
    Project.findById.mockResolvedValue(null);

    await createReadingResult(req, res);

    // Ahora Project NO es undefined, sino que su método devuelve null
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "PROJECT_NOT_FOUND" }));
  });

  test("🚫 403 - Usuario no es dueño del proyecto", async () => {
    Project.findById.mockResolvedValue({
      _id: "proj_1",
      ownerId: { toString: () => "otro_usuario" }, // ID diferente a req.user.id
    });
    
    // El mock de User ya está configurado en beforeEach, así que no fallará ahí

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "FORBIDDEN_PROJECT" }));
  });

  // ==========================================
  // BLOQUE 2: LÓGICA DE NEGOCIO (HAPPY PATHS)
  // ==========================================

  test("✅ 201 - Crea Actividad Nueva + Resultado Aprobado + Notifica n8n", async () => {
    // 1. Setup Datos del Proyecto Correcto
    Project.findById.mockResolvedValue({ _id: "proj_1", ownerId: { toString: () => "student_1" } });
    
    // 2. Actividad NO existe -> Se debe crear con defaults (minScore 5)
    ReadingActivity.findById.mockResolvedValue(null);
    ReadingActivity.create.mockResolvedValue({ _id: "act_1", minScore: 5 });

    // 3. Resultado (Scores suficientes para pasar el default de 5)
    // Promedio: (4 + 6) / 2 = 5. 5 >= 5 -> Aprobado.
    req.body.mcScore = 4;
    req.body.openScore = 6;
    
    ReadingResult.create.mockImplementation((data) => Promise.resolve({ ...data, _id: "res_1" }));

    // 4. Progreso
    ReadingActivity.countDocuments.mockResolvedValue(10);
    ReadingResult.distinct.mockResolvedValue(["act_1"]);

    // --- EJECUCIÓN ---
    await createReadingResult(req, res);

    // --- ASERCIONES ---
    
    // a) Verifica creación de actividad con valores por defecto del controlador
    expect(ReadingActivity.create).toHaveBeenCalledWith(expect.objectContaining({
      _id: "act_1",
      minScore: 5, 
      title: "Lectura crítica 1"
    }));

    // b) Verifica creación de resultado APROBADO
    expect(ReadingResult.create).toHaveBeenCalledWith(expect.objectContaining({
      passed: true,
      totalScore: 5
    }));

    // c) Verifica actualización de proyecto
    expect(Project.findByIdAndUpdate).toHaveBeenCalled();

    // d) Verifica notificación a n8n (porque aprobó)
    expect(notifyReadingCompleted).toHaveBeenCalled();

    // e) Respuesta final
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("✅ 201 - Usa Actividad Existente + Resultado Reprobado + NO notifica", async () => {
    // 1. Setup
    Project.findById.mockResolvedValue({ _id: "proj_1", ownerId: { toString: () => "student_1" } });

    // 2. Actividad EXISTE con un score alto exigente (15)
    ReadingActivity.findById.mockResolvedValue({ _id: "act_1", minScore: 15 });

    // 3. El alumno saca 10 (Promedio 10). 10 < 15 -> Reprobado.
    req.body.mcScore = 10;
    req.body.openScore = 10;

    ReadingResult.create.mockResolvedValue({ passed: false });
    
    // Progreso mocks
    ReadingActivity.countDocuments.mockResolvedValue(5);
    ReadingResult.distinct.mockResolvedValue([]);

    // --- EJECUCIÓN ---
    await createReadingResult(req, res);

    // --- ASERCIONES ---
    expect(ReadingActivity.create).not.toHaveBeenCalled(); // No crea actividad nueva
    
    expect(ReadingResult.create).toHaveBeenCalledWith(expect.objectContaining({
      passed: false, // Reprobado
      totalScore: 10
    }));

    // IMPORTANTE: NO debe notificar a n8n si reprueba
    expect(notifyReadingCompleted).not.toHaveBeenCalled();
    
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ==========================================
  // BLOQUE 3: EDGE CASES Y ERRORES DE SERVIDOR
  // ==========================================

  test("🔥 Branch Coverage: Progreso con 0 actividades totales", async () => {
    // Setup básico para pasar validaciones
    Project.findById.mockResolvedValue({ _id: "proj_1", ownerId: { toString: () => "student_1" } });
    ReadingActivity.findById.mockResolvedValue({ minScore: 5 });
    ReadingResult.create.mockResolvedValue({});

    // Caso: countDocuments devuelve 0 (evitar división por cero)
    ReadingActivity.countDocuments.mockResolvedValue(0);
    ReadingResult.distinct.mockResolvedValue([]);

    await createReadingResult(req, res);

    // Verifica que el porcentaje sea 0
    expect(Project.findByIdAndUpdate).toHaveBeenCalledWith("proj_1", expect.objectContaining({
      progressPercent: 0
    }));
  });

  test("💥 500 - Error de Base de Datos", async () => {
    const logSpy = suppressLogs();
    // Simulamos crash real de base de datos
    Project.findById.mockRejectedValue(new Error("DB Connection Failed"));

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "SERVER" }));
    logSpy.mockRestore();
  });
});