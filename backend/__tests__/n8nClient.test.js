/**
 * __tests__/n8nClient.test.js
 * Cobertura Objetivo: 100% Statements, Branches, Functions, Lines
 */

import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================
// Mockeamos node-fetch para interceptar las llamadas HTTP
jest.mock("node-fetch", () => jest.fn());

// ==========================================
// 2. SETUP
// ==========================================
let notifyReadingCompleted;
let fetch; // aquí guardaremos la referencia al mock

// Helper para silenciar logs
const suppressLogs = () => {
  const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});
  const spyWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
  return { spyErr, spyWarn };
};

describe("🔌 n8nClient Utils", () => {
  beforeAll(async () => {
    // Import dinámico para asegurar que el mock de node-fetch se aplique
    const fetchMod = await import("node-fetch");
    fetch = fetchMod.default;

    const mod = await import("../utils/n8nClient.js");
    notifyReadingCompleted = mod.notifyReadingCompleted;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Valor por defecto para tests exitosos
    process.env.N8N_WEBHOOK_READING_COMPLETED = "http://fake-n8n.com/webhook";
  });

  afterEach(() => {
    // Restaurar env vars si las borramos
    process.env.N8N_WEBHOOK_READING_COMPLETED = "http://fake-n8n.com/webhook";
  });

  // =================================================================
  // TESTS
  // =================================================================

  test("✅ Envía notificación correctamente (Happy Path)", async () => {
    // Simulamos que fetch responde OK
    fetch.mockResolvedValue({ ok: true });

    const mockData = {
      project: { _id: "p1", name: "Proyecto Alpha" },
      student: { _id: "s1", name: "Juan", email: "juan@test.com" },
      result: { 
        mcScore: 10, openScore: 10, totalScore: 20, passed: true, createdAt: new Date() 
      },
      progress: { completedActivities: 5 }
    };

    await notifyReadingCompleted(mockData);

    // Verificar llamada
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://fake-n8n.com/webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Verificamos que el body sea un string que contiene datos clave
        body: expect.stringContaining('"projectName":"Proyecto Alpha"'),
      })
    );
  });

  test("⚠️ No envía nada si falta la variable de entorno (Branch)", async () => {
    delete process.env.N8N_WEBHOOK_READING_COMPLETED;
    
    const { spyWarn } = suppressLogs();

    await notifyReadingCompleted({ project: {}, student: {}, result: {} });

    expect(fetch).not.toHaveBeenCalled();
    expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining("no está configurado"));
    
    spyWarn.mockRestore();
  });

  test("🛡️ Maneja datos de estudiante faltantes (Defaults Branch)", async () => {
    fetch.mockResolvedValue({ ok: true });

    const mockData = {
      project: { _id: "p1", name: "P" },
      // student es undefined/null
      student: null, 
      result: { mcScore: 0, openScore: 0, totalScore: 0, passed: false },
      progress: {}
    };

    await notifyReadingCompleted(mockData);

    // Debemos interceptar el body para ver si usó el fallback "Estudiante"
    const callArgs = fetch.mock.calls[0];
    const bodyString = callArgs[1].body;
    const bodyObj = JSON.parse(bodyString);

    expect(bodyObj.studentName).toBe("Estudiante");
    expect(bodyObj.studentId).toBeUndefined(); // student?._id undefined
  });

  test("🛡️ Maneja estudiante sin nombre (Defaults Branch 2)", async () => {
    fetch.mockResolvedValue({ ok: true });

    const mockData = {
      project: { _id: "p1", name: "P" },
      student: { _id: "s1" }, // Sin nombre ni email
      result: { mcScore: 0, openScore: 0, totalScore: 0 },
      progress: {}
    };

    await notifyReadingCompleted(mockData);

    const bodyObj = JSON.parse(fetch.mock.calls[0][1].body);
    expect(bodyObj.studentName).toBe("Estudiante");
  });

  test("💥 Captura error de red y lo loguea (Catch)", async () => {
    const { spyErr } = suppressLogs();
    
    // Simulamos fallo en fetch
    fetch.mockRejectedValue(new Error("Connection Refused"));

    await notifyReadingCompleted({ project: { _id: "p1" }, student: {}, result: {} });

    expect(spyErr).toHaveBeenCalledWith(
      "⚠️ Error notificando a n8n:", 
      "Connection Refused"
    );
    
    spyErr.mockRestore();
  });
});