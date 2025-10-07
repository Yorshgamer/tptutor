const { evaluateOpen } = require("../controllers/evaluateController");
const { ollamaRequest } = require("../utils/ollamaClient");

// 🧪 Mockeamos la función de Ollama
jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn(),
}));

// 🔇 Silenciar logs de error en la consola (para que el test no ensucie la salida)
const origError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = origError;
});

describe("🧠 evaluateOpen controller", () => {
  let req, res;

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
    ollamaRequest.mockResolvedValue(
      JSON.stringify({ score: 17, feedback: "Buena comprensión del texto." })
    );

    await evaluateOpen(req, res);

    expect(res.json).toHaveBeenCalledWith({
      score: 17,
      feedback: "Buena comprensión del texto.",
    });
  });

  test("⚠️ maneja error si el output no es JSON válido", async () => {
    ollamaRequest.mockResolvedValue("Esto no es JSON");

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
    ollamaRequest.mockRejectedValue(new Error("fallo interno en la API"));

    await evaluateOpen(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Error interno al evaluar resumen.",
      })
    );
  });
});
