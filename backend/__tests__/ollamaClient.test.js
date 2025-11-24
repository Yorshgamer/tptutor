/**
 * __tests__/ollamaClient.test.js
 * Cobertura Objetivo: 100% Statements, Branches, Functions, Lines
 */

import { jest } from "@jest/globals";

// ==========================================
// SETUP GLOBAL
// ==========================================
// Guardamos el fetch original por si acaso (aunque Jest maneja el entorno)
const originalFetch = global.fetch;

describe("🤖 ollamaClient Utils", () => {
  
  beforeEach(() => {
    // Reseteamos el cache de módulos antes de cada test para 
    // que la constante 'baseUrl' se re-evalúe según las ENV VARS
    jest.resetModules();
    
    // Mockeamos fetch globalmente
    global.fetch = jest.fn();
    
    // Limpiamos variables de entorno relevantes
    delete process.env.OLLAMA_BASE_URL;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // =================================================================
  // 1. CONFIGURATION TESTS (baseUrl)
  // =================================================================

  test("🌐 Usa localhost por defecto si no hay ENV VAR", async () => {
    // 1. Importamos el módulo dinámicamente (se evalúa baseUrl aquí)
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    // 2. Mock respuesta OK
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "ok" }),
    });

    await ollamaRequest("test");

    // 3. Verificamos URL por defecto
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:11434/),
      expect.any(Object)
    );
  });

  test("🌐 Usa variable de entorno OLLAMA_BASE_URL si existe", async () => {
    // 1. Configuramos ENV
    process.env.OLLAMA_BASE_URL = "http://mi-servidor-ollama:9999";
    
    // 2. Re-importamos (jest.resetModules() en beforeEach permite esto)
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "ok" }),
    });

    await ollamaRequest("test");

    // 3. Verificamos URL custom
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/mi-servidor-ollama:9999/),
      expect.any(Object)
    );
  });

  // =================================================================
  // 2. RESPONSE HANDLING TESTS
  // =================================================================

  test("✅ Devuelve texto limpio (trim) cuando es exitoso", async () => {
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "  Hola Mundo  " }),
    });

    const result = await ollamaRequest("prompt");
    expect(result).toBe("Hola Mundo");
  });

  test("🛡️ Maneja respuesta JSON sin propiedad 'response' (null/undefined)", async () => {
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    // Simula API devolviendo algo inesperado pero válido JSON
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ otherField: 123 }), // response es undefined
    });

    const result = await ollamaRequest("prompt");
    // String(undefined).trim() -> "undefined" NO, tu código hace: const out = data.response ?? ""
    expect(result).toBe("");
  });

  // =================================================================
  // 3. ERROR HANDLING & ROBUSTNESS (Branches difíciles)
  // =================================================================

  test("❌ Lanza error con status y texto cuando !ok", async () => {
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Model not found",
    });

    await expect(ollamaRequest("fail")).rejects.toThrow("Error de Ollama (404): Model not found");
  });

  test("🔥 Robustez: Maneja fallo al leer response.text()", async () => {
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      // text() existe pero lanza error (ej: stream cortado)
      text: async () => { throw new Error("Stream error"); },
    });

    // Tu código hace .catch(() => "")
    await expect(ollamaRequest("fail")).rejects.toThrow("Error de Ollama (500):");
  });

  test("🔥 Robustez: Maneja ausencia de response.text() function", async () => {
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      // text propiedad no existe en el objeto response mockeado
      text: undefined, 
    });

    // Tu código: (response.text ? ... : Promise.resolve(""))
    await expect(ollamaRequest("fail")).rejects.toThrow("Error de Ollama (500):");
  });

  test("🔥 Robustez: Maneja ausencia de response.status (?? 'unknown')", async () => {
    const { ollamaRequest } = await import("../utils/ollamaClient.js");

    global.fetch.mockResolvedValue({
      ok: false,
      // status undefined
      text: async () => "Error raro",
    });

    await expect(ollamaRequest("fail")).rejects.toThrow("Error de Ollama (unknown): Error raro");
  });
});