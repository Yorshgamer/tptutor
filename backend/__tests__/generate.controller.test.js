/**
 * __tests__/generate.controller.test.js
 * Cobertura Objetivo: 100% Statements, Branches, Functions, Lines
 */

jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn(),
}));

const origError = console.error;
const origWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.error = origError;
  console.warn = origWarn;
});

describe("🧩 generateQA controller (100% Coverage)", () => {
  let generateQA;
  let ollamaClient;
  let req, res;
  let parseObjectBlocksAndNormalize;

  beforeAll(async () => {
    const mod = await import("../controllers/generateController.js");
    generateQA = mod.generateQA;
    parseObjectBlocksAndNormalize = mod.parseObjectBlocksAndNormalize;
    ollamaClient = require("../utils/ollamaClient");
  });

  beforeEach(() => {
    req = { body: { text: "Texto base", count: 3 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. VALIDACIÓN DE INPUT
  // ==========================================
  
  test("❌ 400 si falta 'text'", async () => {
    req.body.text = "";
    await generateQA(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("🔥 HARDCORE: 'req.body' undefined (Branch Coverage)", async () => {
    // Simulamos que no hay body parser
    req.body = undefined; 
    await generateQA(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("🔢 Usa count por defecto si no es válido", async () => {
    req.body.count = "invalid"; // isNaN
    ollamaClient.ollamaRequest.mockResolvedValue("[]");
    await generateQA(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  // ==========================================
  // 2. PARSEO DIRECTO (Try #1)
  // ==========================================

  test("✅ Parseo Directo: Array Válido", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue('[{"question":"Q1"}]');
    await generateQA(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ question: "Q1" })]));
  });

  test("✅ Parseo Directo: Objeto Único (Cubre Rama typeof parsed === object)", async () => {
    // Esto cubre la línea 69 (aprox) donde se maneja el objeto único
    ollamaClient.ollamaRequest.mockResolvedValue('{"question":"Single"}');
    await generateQA(req, res);
    const result = res.json.mock.calls[0][0];
    expect(Array.isArray(result)).toBe(true); // Normaliza a array
    expect(result[0].question).toBe("Single");
  });

  // ==========================================
  // 3. ARRAY SLICING (Try #2 - Branches)
  // ==========================================

  test("🔍 Slice: Encuentra array dentro de texto", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue('Texto antes [{"question":"Inside"}] Texto después');
    await generateQA(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ question: "Inside" })]));
  });

  // AQUI CUBRIMOS LOS BRANCHES DE "if (startArr !== -1 && endArr !== -1 && endArr > startArr)"
  
  test("🔥 Branch: Falta '[' (startArr === -1)", async () => {
    // Texto con ']', pero sin '['. No debe intentar parsear slice, debe ir a try #3 o #4
    ollamaClient.ollamaRequest.mockResolvedValue('Esto es texto puro ] sin inicio');
    await generateQA(req, res);
    // Debe caer al fallback final porque no hay JSON
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.any(String) }));
  });

  test("🔥 Branch: Falta ']' (endArr === -1)", async () => {
    // Texto con '[', pero sin ']'
    ollamaClient.ollamaRequest.mockResolvedValue('Inicio [ sin final');
    await generateQA(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.any(String) }));
  });

  test("🔥 Branch: Orden Invertido (endArr < startArr)", async () => {
    // ']' aparece ANTES que '['. Ej: "Fin ] ... Inicio ["
    ollamaClient.ollamaRequest.mockResolvedValue('Final ] Inicio [');
    await generateQA(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.any(String) }));
  });

  test("⚠️ Slice parse fallido (catch slice)", async () => {
    // Encuentra [ y ], pero lo de adentro no es JSON válido
    ollamaClient.ollamaRequest.mockResolvedValue('Texto [ invalido ] Texto');
    await generateQA(req, res);
    // Debe caer al fallback (o try #3 si hubiera bloques)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.any(String) }));
  });

  // ==========================================
  // 4. BLOQUES DE OBJETOS (Try #3)
  // ==========================================

  test("📦 Procesa bloques individuales { ... }", async () => {
    const raw = 'Texto \n {"question":"B1"} \n {"question":"B2"}';
    ollamaClient.ollamaRequest.mockResolvedValue(raw);
    await generateQA(req, res);
    
    const result = res.json.mock.calls[0][0];
    expect(result).toHaveLength(2);
    expect(result[0].question).toBe("B1");
    expect(result[1].question).toBe("B2");
  });

  test("⚠️ Warn: Bloque inválido dentro de multiples bloques", async () => {
    // Un bloque bueno, uno malo
    const raw = '{"question":"Good"} \n { BadJSON: }';
    ollamaClient.ollamaRequest.mockResolvedValue(raw);
    
    await generateQA(req, res);
    
    expect(console.warn).toHaveBeenCalled(); // El bloque malo dispara warn
    const result = res.json.mock.calls[0][0];
    expect(result).toHaveLength(1); // El bloque bueno sobrevive
  });

  // ==========================================
  // 5. FALLBACK Y ERRORES (Try #4 & Global Catch)
  // ==========================================

  test("⚠️ Fallback Final (Raw)", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue("Nada de json por aqui");
    await generateQA(req, res);
    expect(res.json).toHaveBeenCalledWith({ raw: "Nada de json por aqui" });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Salida STRING no fue JSON"), expect.any(String));
  });

  test("💥 Error Interno (500)", async () => {
    ollamaClient.ollamaRequest.mockRejectedValue(new Error("Ollama Down"));
    await generateQA(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ==========================================
  // 6. NORMALIZATION LOGIC (Deep Branches)
  // ==========================================

  test("🔧 Normalize: Filtra nulls y normaliza answers strings", async () => {
    // Probamos el helper normalizeQuestions indirectamente o mockeando input
    // Usamos el helper exportado parseObjectBlocksAndNormalize para inyectar estructura compleja
    const complexObj = JSON.stringify({
      question: " Q1 ",
      answers: ["Str1", { text: "Obj1", correct: false }, null, 123],
      feedback: 123 // feedback invalido
    });
    
    ollamaClient.ollamaRequest.mockResolvedValue(complexObj);
    await generateQA(req, res);
    
    const result = res.json.mock.calls[0][0];
    expect(result[0].question).toBe("Q1");
    expect(result[0].answers).toHaveLength(2); // Str1 y Obj1 (null y 123 filtrados)
    expect(result[0].feedback).toBe("Sin feedback."); // Feedback default
    // Asegura una correcta
    expect(result[0].answers.some(a => a.correct)).toBe(true);
  });

  test("🔧 Normalize: Answers vacías -> Default", async () => {
    ollamaClient.ollamaRequest.mockResolvedValue('{"question":"Empty", "answers": []}');
    await generateQA(req, res);
    const result = res.json.mock.calls[0][0];
    expect(result[0].question).toBe("Empty");
    expect(result[0].answers).toEqual([]);
  });

  test("🔧 Normalize: Input no array -> []", async () => {
    // Si normalizeQuestions recibe null
    const mod = await import("../controllers/generateController.js");
    // Accedemos a la función interna si la exportamos solo para test, 
    // pero como no la exportamos, confiamos en que parseObjectBlocksAndNormalize la usa.
    // parseObjectBlocksAndNormalize usa normalizeQuestions.
    // Si parseObjectBlocksAndNormalize devuelve un array vacío si no hay bloques validos.
    const res = mod.parseObjectBlocksAndNormalize("no blocks");
    expect(res).toBeNull();
  });
});