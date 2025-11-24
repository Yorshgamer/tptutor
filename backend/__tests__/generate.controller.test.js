// __tests__/generate.controller.test.js
// Tests para controllers/generateController.js (cubrimos ramas direct, slice array, object blocks, normalizeQuestions)

jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn(),
}));

// Silenciar console.error en los tests
const origError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = origError;
});

describe("🧩 generateQA controller (unit)", () => {
  let generateQA;
  let ollamaClient;
  let req, res;

  beforeAll(async () => {
    // import dinámico para evitar ESM/top-level await issues
    const mod = await import("../controllers/generateController.js");
    generateQA = mod.generateQA;
    // obtener el mock ya hoisteado
    ollamaClient = require("../utils/ollamaClient");
  });

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

  test("✅ devuelve array de preguntas cuando la salida es JSON válido (array)", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue(
      JSON.stringify([
        {
          question: "¿Qué hizo María?",
          answers: [
            { text: "Salió a caminar", correct: false },
            "Durmió",
            { text: "Comió", correct: false },
            { text: "Leyó", correct: false },
          ],
          feedback: "Correcto.",
        },
      ])
    );

    await generateQA(req, res);

    // normalizeQuestions debe convertir el string a objeto y marcar al menos una correcta
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          question: expect.any(String),
          answers: expect.any(Array),
          feedback: expect.any(String),
        }),
      ])
    );

    // verificar que la primera respuesta quedó marcada como correcta si no había correct true
    const sent = res.json.mock.calls[0][0];
    expect(Array.isArray(sent)).toBe(true);
    expect(sent[0].answers.some((a) => a.correct === true)).toBe(true);
  });

  test("🔍 extrae array dentro de texto (startArr / endArr slice path)", async () => {
    // respuesta que contiene texto y luego un array JSON -> debe extraer y parsear
    const arr = [
      { question: "q1", answers: ["a", "b", "c", "d"], feedback: "f1" },
      { question: "q2", answers: ["a", "b", "c", "d"], feedback: "f2" },
    ];
    const payload = "Some header text\n\n" + JSON.stringify(arr) + "\nfooter";
    ollamaClient.ollamaRequest.mockResolvedValue(payload);

    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ question: expect.any(String) })])
    );
  });

  test("📦 procesa múltiples objetos separados ( {..}\\n{..} )", async () => {
    // Dos objetos uno debajo del otro (sin estar en un array)
    const o1 = { question: "p1", answers: ["a", "b", "c", "d"], feedback: "f1" };
    const o2 = { question: "p2", answers: ["a", "b", "c", "d"], feedback: "f2" };
    const joined = JSON.stringify(o1) + "\n" + JSON.stringify(o2);
    ollamaClient.ollamaRequest.mockResolvedValue(joined);

    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ question: expect.any(String) })])
    );
  });

  test("🧩 normalizeQuestions - cuando answers son strings los convierte a objetos y asegura una correcta", async () => {
    const arr = [
      { question: "q", answers: ["uno", "dos", "tres", "cuatro"], feedback: "f" },
    ];
    ollamaClient.ollamaRequest.mockResolvedValue(JSON.stringify(arr));

    await generateQA(req, res);

    const sent = res.json.mock.calls[0][0];
    expect(sent[0].answers.every((a) => typeof a.text === "string")).toBe(true);
    // debe existir al menos una correcta
    expect(sent[0].answers.some((a) => a.correct === true)).toBe(true);
  });

  test("🔢 usa 3 como valor por defecto si 'count' no viene (y responde [])", async () => {
    req.body = { text: "Texto base sin count" };
    ollamaClient.ollamaRequest.mockResolvedValue("[]");

    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("⚠️ raw fallback cuando nada parseable -> devuelve { raw }", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue("this is not json nor objects nor arrays");
    await generateQA(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.any(String) }));
  });

  test("💥 maneja error interno de Ollama correctamente (error branch)", async () => {
    // Simulamos fallo de la API
    ollamaClient.ollamaRequest.mockRejectedValue(new Error("Error de red en Ollama"));

    await generateQA(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    // Hacemos la aserción tolerante por si el texto del controller varía
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringMatching(/Error al generar preguntas/i),
      })
    );
  });

  test("🔧 si parsed object único (no array) lo normaliza y devuelve array", async () => {
    const obj = { question: "solo", answers: ["a", "b", "c", "d"], feedback: "fb" };
    ollamaClient.ollamaRequest.mockResolvedValue(JSON.stringify(obj));

    await generateQA(req, res);

    const sent = res.json.mock.calls[0][0];
    expect(Array.isArray(sent)).toBe(true);
    expect(sent[0].question).toBe("solo");
  });
  // ------------------ tests extra para cubrir ramas faltantes ------------------

  // 1) parsed array con elementos inválidos -> filtrados -> posible array vacío
  test("🧹 filtra entradas no-objeto en el array (devuelve [])", async () => {
    // array con null, string, número -> normalizeQuestions filtrará todo y devolverá []
    const raw = JSON.stringify([null, "x", 5, false]);
    ollamaClient.ollamaRequest.mockResolvedValue(raw);

    await generateQA(req, res);

    // normalizeQuestions devolverá [] => res.json([])
    expect(res.json).toHaveBeenCalledWith([]);
  });

  // 2) pregunta con answers vacías -> regresa objeto con answers: [] y question por defecto
  test("📭 si no hay respuestas en la pregunta devuelve answers vacío y pregunta por defecto", async () => {
    const arr = [
      { /* sin question ni answers ni feedback */ },
    ];
    ollamaClient.ollamaRequest.mockResolvedValue(JSON.stringify(arr));

    await generateQA(req, res);

    const sent = res.json.mock.calls[0][0];
    expect(Array.isArray(sent)).toBe(true);
    expect(sent[0].answers).toEqual([]); // answers vacío
    expect(sent[0].question).toBe("Pregunta sin texto"); // texto por defecto
    expect(typeof sent[0].feedback).toBe("string"); // feedback por defecto
  });

  // 3) si ya existe una respuesta marcada como correct, no se toca (cubre hasCorrect === true)
  test("✅ si ya hay una respuesta correcta no reasigna (hasCorrect=true)", async () => {
    const arr = [
      {
        question: "q",
        answers: [
          { text: "a1", correct: false },
          { text: "a2", correct: true }, // ya hay una correcta en 2da posición
          { text: "a3", correct: false },
          { text: "a4", correct: false },
        ],
        feedback: "fb",
      },
    ];

    ollamaClient.ollamaRequest.mockResolvedValue(JSON.stringify(arr));

    await generateQA(req, res);

    const sent = res.json.mock.calls[0][0];
    // debe conservar la segunda respuesta como correcta (no forzar answers[0].correct)
    expect(sent[0].answers[1].correct).toBe(true);
    // y la primera no debe haberse convertido a true
    expect(sent[0].answers[0].correct).toBe(false);
  });

  // 4) answers con elementos inválidos (mix) -> map+filter deja sólo objetos válidos y los normaliza
  test("🔀 answers mixtas (strings, objetos e inválidos) se normalizan y filtran", async () => {
    const arr = [
      {
        question: "mixta",
        answers: [
          "solo-string",
          { text: "obj-text", correct: false },
          12345,
          null,
          { weird: "no-text-field" },
        ],
        feedback: "f",
      },
    ];

    ollamaClient.ollamaRequest.mockResolvedValue(JSON.stringify(arr));
    await generateQA(req, res);

    const sent = res.json.mock.calls[0][0];
    expect(sent[0].answers.every((a) => typeof a.text === "string")).toBe(true);
    // Debe existir al menos una respuesta (las inválidas se filtran)
    expect(sent[0].answers.length).toBeGreaterThan(0);
  });
  test("⚠️ forzamos JSON.parse a fallar en un bloque para cubrir el catch/console.warn", async () => {
    // Bloque válido y bloque inválido (el inválido contiene la palabra 'FORZAR_FAIL')
    const validBlock = JSON.stringify({
      question: "Pregunta válida",
      answers: ["A", "B", "C", "D"],
      feedback: "feedback",
    });
    const invalidBlock = "{ FORZAR_FAIL: true "; // no es JSON válido
    const raw = `${validBlock}\n${invalidBlock}\n`;

    // Mock de la respuesta de Ollama
    ollamaClient.ollamaRequest.mockResolvedValue(raw);

    // Guardamos parse real y lo reemplazamos por uno que lanza solo para el bloque inválido
    const realParse = JSON.parse;
    JSON.parse = (str) => {
      // Si la cadena contiene "FORZAR_FAIL" lanzamos para forzar el catch
      if (typeof str === "string" && str.includes("FORZAR_FAIL")) {
        throw new Error("parse forced fail");
      }
      return realParse(str);
    };

    // Mockear console.warn para detectar su ejecución
    const origWarn = console.warn;
    console.warn = jest.fn();

    // Ejecutar
    await generateQA(req, res);

    // Comprobaciones
    expect(console.warn).toHaveBeenCalled(); // cobertura de la línea del warn/catch
    const sent = res.json.mock.calls[0][0];
    expect(Array.isArray(sent)).toBe(true);
    expect(sent.length).toBe(1);
    expect(sent[0].question).toBe("Pregunta válida");

    // Restaurar JSON.parse y console.warn
    JSON.parse = realParse;
    console.warn = origWarn;
  });
  test("⚠️ dispara console.warn cuando un bloque JSON dentro de objectMatches es inválido", async () => {
    // 🎯 Bloque válido mínimo
    const validBlock = JSON.stringify({
      question: "Pregunta válida",
      answers: ["A", "B", "C", "D"],
      feedback: "feedback"
    });

    // 🎯 Bloque inválido para provocar el catch → console.warn
    const invalidBlock = "{ esto no es json ";

    // Simula la respuesta completa del modelo
    const raw = `${validBlock}\n${invalidBlock}\n`;

    // Mock de ollamaRequest
    ollamaClient.ollamaRequest.mockResolvedValue(raw);

    // Mockear console.warn para detectar su ejecución
    const originalWarn = console.warn;
    console.warn = jest.fn();

    await generateQA(req, res);

    // ✔ Debió llamarse el warn por el bloque inválido
    expect(console.warn).toHaveBeenCalled();

    // ✔ Debió devolver al menos la pregunta válida procesada
    const json = res.json.mock.calls[0][0];
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(1);
    expect(json[0].question).toBe("Pregunta válida");

    // Restaurar
    console.warn = originalWarn;
  });
  // test helper para cubrir la rama catch/console.warn con parse fallando
  test("helper parseObjectBlocksAndNormalize ejecuta console.warn cuando hay bloque inválido", async () => {
    // import dinámico del helper (si ya importaste generateQA en beforeAll, puedes obtenerlo desde allí)
    const mod = await import("../controllers/generateController.js");
    const { parseObjectBlocksAndNormalize } = mod;

    // cadena con un bloque válido y otro inválido para forzar el catch
    const validBlock = JSON.stringify({
      question: "Valida helper",
      answers: ["A", "B", "C", "D"],
      feedback: "f",
    });
    const invalidBlock = "{ FORZAR_FAIL: true "; // inválido -> JSON.parse lanzará

    const raw = `${validBlock}\n${invalidBlock}\n`;
    const trimmed = raw.trim();

    // mockear console.warn para verificar la llamada
    const origWarn = console.warn;
    console.warn = jest.fn();

    const out = parseObjectBlocksAndNormalize(trimmed);

    expect(console.warn).toHaveBeenCalled();
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(1);
    expect(out[0].question).toBe("Valida helper");

    // restaurar console.warn
    console.warn = origWarn;
  });
  test("helper extractJsonObjectLenient devuelve null si no hay '{' en el string", async () => {
    const mod = await import("../controllers/evaluateController.js");
    const { extractJsonObjectLenient } = mod;

    // cadena sin ninguna llave de apertura
    const res = extractJsonObjectLenient("Este texto no contiene llaves ni JSON");
    expect(res).toBeNull();
  });

  test("extractJsonObjectLenient registra error y devuelve null cuando el candidate no es parseable", async () => {
    const mod = await import("../controllers/evaluateController.js");
    const { extractJsonObjectLenient } = mod;

    // input con una "{" pero contenido inválido para JSON -> candidate se construye y JSON.parse fallará
    const invalid = "algo antes { no: 'json' sin comillas } algo despues";

    // mockear console.error
    const origErr = console.error;
    console.error = jest.fn();

    const out = extractJsonObjectLenient(invalid);

    expect(out).toBeNull();
    expect(console.error).toHaveBeenCalled(); // cubre la línea de console.error dentro del catch

    // restaurar
    console.error = origErr;
  });
  test("💥 evaluateOpen maneja un throw no-Error (err sin .message) y responde 500", async () => {
    // import dinámico del controller
    const mod = await import("../controllers/evaluateController.js");
    const { evaluateOpen } = mod;

    // preparamos req/res mínimos
    const req = { body: { text: "texto", studentAnswer: "respuesta" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mockear ollamaRequest para que *lance* un string en lugar de Error object
    const client = require("../utils/ollamaClient");
    client.ollamaRequest.mockRejectedValue("boom-string-error");

    // Silence console.error para no llenar la salida
    const origErr = console.error;
    console.error = jest.fn();

    await evaluateOpen(req, res);

    // Debe devolver 500
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Error interno al evaluar resumen." })
    );

    // restaurar mocks
    console.error = origErr;
    client.ollamaRequest.mockReset();
  });

});
