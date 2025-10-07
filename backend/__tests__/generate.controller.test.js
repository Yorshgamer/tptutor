const { generateQA } = require("../controllers/generateController");
const { ollamaRequest } = require("../utils/ollamaClient");

// 🧪 Mockeamos el cliente de Ollama
jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn(),
}));

// 🔇 Evitar logs de error durante los tests
const origError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = origError;
});

describe("🧩 generateQA controller (unit)", () => {
  let req, res;

  beforeEach(() => {
    req = { body: { text: "Texto base de prueba", count: 3 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("❌ 400 si falta 'text'", async () => {
    req.body.text = "";
    await generateQA(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  test("✅ devuelve array de preguntas cuando la salida es JSON válido", async () => {
    ollamaRequest.mockResolvedValue(
      JSON.stringify([
        {
          question: "¿Qué hizo María?",
          answers: [
            { text: "Salió a caminar", correct: true },
            { text: "Durmió", correct: false },
            { text: "Comió", correct: false },
            { text: "Leyó", correct: false },
          ],
          feedback: "Correcto.",
        },
      ])
    );

    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          question: expect.any(String),
          answers: expect.any(Array),
          feedback: expect.any(String),
        }),
      ])
    );
  });

  test("⚠️ cuando el modelo no devuelve JSON, responde con { raw }", async () => {
    ollamaRequest.mockResolvedValue("no-json-raw-text");

    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ raw: expect.any(String) })
    );
  });

  test("🧮 usa 3 como valor por defecto si 'count' no viene", async () => {
    req.body = { text: "Texto base sin count" };
    ollamaRequest.mockResolvedValue("[]");

    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("💥 maneja error interno de Ollama correctamente", async () => {
    // Simulamos un fallo de red o problema interno
    ollamaRequest.mockRejectedValue(new Error("Error de red en Ollama"));

    await generateQA(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Error al generar preguntas",
      })
    );
  });
});
