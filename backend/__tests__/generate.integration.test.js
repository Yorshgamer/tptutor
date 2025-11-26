/**
 * __tests__/generate.routes.test.js
 * Cobertura Objetivo: 100% (Route Wiring)
 */

import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ==========================================
// 1. MOCK DEL CONTROLADOR
// ==========================================
// No mockeamos Ollama aquí, mockeamos al "Jefe" de la lógica: el Controlador.
jest.mock("../controllers/generateController.js", () => ({
  generateQA: jest.fn((req, res) => {
    // Simulamos que el controlador hace su trabajo y responde JSON
    return res.status(200).json([
      { question: "Mock Q", answers: [], feedback: "Mock FB" }
    ]);
  }),
}));

// ==========================================
// 2. VARIABLES GLOBALES
// ==========================================
let generateRoutes;
let app;
// Referencia al mock para aserciones
let generateControllerMock; 

describe("🚀 /api/generate-qa Routes", () => {
  
  // Carga dinámica para soportar ESM
  beforeAll(async () => {
    // Importamos el router
    const routeModule = await import("../routes/generateRoutes.js");
    generateRoutes = routeModule.default;
    
    // Importamos el mock del controlador para poder espiarlo
    const controllerModule = await import("../controllers/generateController.js");
    generateControllerMock = controllerModule.generateQA;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/generate-qa", generateRoutes);
  });

  test("✅ POST / debería delegar al controlador generateQA y devolver 200", async () => {
    const res = await request(app)
      .post("/api/generate-qa")
      .send({ text: "Texto de prueba", count: 3 });

    // 1. Verificamos respuesta HTTP
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].question).toBe("Mock Q");

    // 2. Verificamos que el router llamó al controlador correcto
    expect(generateControllerMock).toHaveBeenCalled();
  });

  // Test opcional para asegurar que otros métodos no están definidos (404)
  test("🚫 GET / debería devolver 404 (Método no permitido)", async () => {
    const res = await request(app).get("/api/generate-qa");
    expect(res.statusCode).toBe(404);
  });
});