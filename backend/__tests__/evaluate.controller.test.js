// __tests__/evaluate.controller.test.js
// Versión adaptada para evitar top-level await / ESM import issues

// Mockeamos la función de Ollama (esto debe estar arriba para que Jest lo hoistee)
jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn(),
}));

// Silenciar logs de error en la consola (como tenías)
const origError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = origError;
});

describe("🧠 evaluateOpen controller", () => {
  let req, res;
  // variables que asignaremos en beforeAll
  let evaluateOpen;
  let ollamaClient; // la versión mockeada

  beforeAll(async () => {
    // Import dinámico dentro de beforeAll para evitar top-level await / ESM issues
    const mod = await import("../controllers/evaluateController.js");
    // named export
    evaluateOpen = mod.evaluateOpen;

    // Importar el mock (CommonJS require es ok aquí porque jest.mock ya aplicó el mock)
    ollamaClient = require("../utils/ollamaClient");
  });

  beforeEach(() => {
    req = {
      body: {
        text: "El sol brilla en lo alto.",
        studentAnswer: "El texto trata sobre el sol brillando.",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // resetear el mock antes de cada test
    ollamaClient.ollamaRequest.mockReset();
  });

  test("❌ retorna 400 si falta el texto base", async () => {
    req.body.text = "";
    await evaluateOpen(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Debe enviarse el texto base para evaluar.",
    });
  });

  test("❌ retorna 400 si falta la respuesta del estudiante", async () => {
    req.body.studentAnswer = "";
    await evaluateOpen(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Debe escribirse una respuesta del estudiante para evaluar.",
    });
  });

  test("✅ retorna el score y feedback correctamente (mock)", async () => {
    // Ollama devuelve string JSON (tal como el controlador espera)
    ollamaClient.ollamaRequest.mockResolvedValue(
      JSON.stringify({ score: 17, feedback: "Buena comprensión del texto." })
    );

    await evaluateOpen(req, res);

    expect(res.json).toHaveBeenCalledWith({
      score: 17,
      feedback: "Buena comprensión del texto.",
    });
  });

  test("⚠️ maneja error si el output no es JSON válido", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue("Esto no es JSON");

    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "La respuesta del modelo no fue válida.",
      })
    );
  });

  test("💥 maneja error interno de Ollama correctamente", async () => {
    // Simulamos que Ollama lanza un error (por red o timeout)
    ollamaClient.ollamaRequest.mockRejectedValue(new Error("fallo interno en la API"));

    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Error interno al evaluar resumen.",
      })
    );
  });

  test("🔍 extrae JSON aunque venga con texto antes y después", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue(
      "Intro basura... {\"score\":12,\"feedback\":\"Interpreta correctamente\"} y algo más"
    );

    await evaluateOpen(req, res);

    expect(res.json).toHaveBeenCalledWith({
      score: 12,
      feedback: "Interpreta correctamente",
    });
  });

  test("🧩 añade llave faltante y parsea (missing closing brace)", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue(
      '{"score":16,"feedback":"Muy buena respuesta"' // sin cierre
    );

    await evaluateOpen(req, res);

    expect(res.json).toHaveBeenCalledWith({
      score: 16,
      feedback: "Muy buena respuesta",
    });
  });

  test("📌 JSON directo válido aunque los tipos no sean los 'esperados' (score string)", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue(
      JSON.stringify({ score: "17", feedback: "OK pero score es string" })
    );

    await evaluateOpen(req, res);

    expect(res.json).toHaveBeenCalledWith({
      score: "17",
      feedback: "OK pero score es string",
    });
  });

  test("❌ lenient encuentra candidate pero no puede parsearlo -> 502", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue(
      'Algun texto {not: "a valid json", missingQuotes: true} y mas texto'
    );

    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "La respuesta del modelo no fue válida.",
      })
    );
  });

  test("🚫 maneja respuesta vacía del modelo -> 502", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue("");
    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "La respuesta del modelo no fue válida." })
    );
  });

  test("🔧 lenient parsea candidate pero tipos inválidos -> 502", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue('  some text { "score": null, "feedback": 123 } trailing ');
    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "La respuesta del modelo no fue válida." })
    );
  });

  test("📚 JSON directo cualquiera (array) -> devuelve lo parseado (cubre rama direct parse)", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue(JSON.stringify([{ score: 10, feedback: "ok" }]));
    await evaluateOpen(req, res);

    expect(res.json).toHaveBeenCalledWith(JSON.parse(JSON.stringify([{ score: 10, feedback: "ok" }])));
  });

  test("❗ extractJsonObjectLenient falla al parsear candidate -> 502 y se registra error", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue('prefix { invalid: } suffix');
    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "La respuesta del modelo no fue válida." })
    );
  });

  // ----------------- Tests adicionales para ramas de cobertura -----------------

  test("extractJsonObjectLenient devuelve null si la cadena no contiene '{' (cubre start === -1)", async () => {
    const mod = await import("../controllers/evaluateController.js");
    const { extractJsonObjectLenient } = mod;

    expect(typeof extractJsonObjectLenient).toBe("function");

    const input = "Este texto no tiene llaves, solo palabras y números 1234.";
    const out = extractJsonObjectLenient(input);
    expect(out).toBeNull();
  });

  test("extractJsonObjectLenient registra error y devuelve null cuando el candidate no es parseable", async () => {
    const mod = await import("../controllers/evaluateController.js");
    const { extractJsonObjectLenient } = mod;

    const invalid = "prefix { not: invalid_json } suffix";

    const origErr = console.error;
    console.error = jest.fn();

    const out = extractJsonObjectLenient(invalid);

    expect(out).toBeNull();
    expect(console.error).toHaveBeenCalled();

    console.error = origErr;
  });

  test("evaluateOpen maneja un throw no-Error (err sin .message) y responde 500 (cubre catch final)", async () => {
    const mod = await import("../controllers/evaluateController.js");
    const { evaluateOpen } = mod;

    const reqLocal = { body: { text: "texto", studentAnswer: "respuesta" } };
    const resLocal = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    const client = require("../utils/ollamaClient");
    client.ollamaRequest.mockRejectedValue("boom-string-error");

    const origErr = console.error;
    console.error = jest.fn();

    await evaluateOpen(reqLocal, resLocal);

    expect(resLocal.status).toHaveBeenCalledWith(500);
    expect(resLocal.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Error interno al evaluar resumen." })
    );

    console.error = origErr;
    client.ollamaRequest.mockReset();
  });
  test("🔧 lenient: score es número (OK) pero feedback inválido (FAIL) -> 502 (cubre rama final)", async () => {
    // Escenario:
    // 1. JSON.parse directo falla (por el texto 'basura').
    // 2. extractJsonObjectLenient tiene éxito parseando el objeto.
    // 3. Condición if: 
    //    - obj: TRUE
    //    - score es número: TRUE (18)
    //    - feedback es string: FALSE (es número 12345) -> AQUÍ CUBRIMOS EL BRANCH FALTANTE
    ollamaClient.ollamaRequest.mockResolvedValue(
      'basura { "score": 18, "feedback": 12345 } basura'
    );

    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "La respuesta del modelo no fue válida." })
    );
  });
  test("📭 maneja request sin body definido (cubre rama req.body || {})", async () => {
    // Forzamos que req.body sea undefined
    req = {}; 
    
    await evaluateOpen(req, res);

    // Debería fallar igual que cuando falta el texto
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Debe enviarse el texto base para evaluar.",
    });
  });
});
