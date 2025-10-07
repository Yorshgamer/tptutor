const request = require("supertest");
const app = require("../index");

// Mock de mammoth y del cliente de Ollama
jest.mock("mammoth", () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: "Texto base del DOCX para pruebas." }),
}));

jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn(),
}));

// Silenciar errores en consola para no ensuciar el output del test
const origError = console.error;
beforeAll(() => { console.error = jest.fn(); });
afterAll(() => { console.error = origError; });

describe("🌐 Flujo E2E: upload → generate-qa → evaluate-open", () => {
  test("✅ procesa el flujo completo con mocks", async () => {
    const { ollamaRequest } = require("../utils/ollamaClient");

    // 1️⃣ .upload → devuelve texto
    const uploadRes = await request(app)
      .post("/api/upload")
      .attach("file", Buffer.from("fake docx content"), "test.docx");

    expect(uploadRes.statusCode).toBe(200);
    expect(uploadRes.body.text).toContain("Texto base del DOCX");

    const textoBase = uploadRes.body.text;

    // 2️⃣ .generate-qa → primera respuesta del mock de Ollama (array de QAs)
    ollamaRequest
      .mockResolvedValueOnce(
        JSON.stringify([
          {
            question: "¿Qué describe el texto?",
            answers: [
              { text: "Un día soleado", correct: true },
              { text: "Una tormenta", correct: false },
              { text: "Una fiesta", correct: false },
              { text: "Un examen", correct: false },
            ],
            feedback: "Correcto, el texto sugiere un día agradable.",
          },
        ])
      )
      // 3️⃣ .evaluate-open → segunda respuesta del mock (score/feedback)
      .mockResolvedValueOnce(
        JSON.stringify({
          score: 18,
          feedback: "Buena comprensión con redacción clara.",
        })
      );

    const generateRes = await request(app)
      .post("/api/generate-qa")
      .send({ text: textoBase, count: 1 });

    expect(generateRes.statusCode).toBe(200);
    expect(Array.isArray(generateRes.body)).toBe(true);
    expect(generateRes.body[0]).toMatchObject({
      question: expect.any(String),
      answers: expect.any(Array),
      feedback: expect.any(String),
    });
    expect(generateRes.body[0].answers).toHaveLength(4);

    // 3️⃣ .evaluate-open → usa el mismo texto base y una respuesta simulada
    const evaluateRes = await request(app)
      .post("/api/evaluate-open")
      .send({
        text: textoBase,
        studentAnswer: "El texto muestra un día agradable y tranquilo.",
      });

    expect(evaluateRes.statusCode).toBe(200);
    expect(evaluateRes.body).toMatchObject({
      score: expect.any(Number),
      feedback: expect.any(String),
    });
    expect(evaluateRes.body.score).toBeGreaterThanOrEqual(0);
    expect(evaluateRes.body.score).toBeLessThanOrEqual(20);
  });

  test("❌ errores de validación en el flujo (faltan campos)", async () => {
    // generate-qa sin text
    const genBad = await request(app).post("/api/generate-qa").send({ count: 2 });
    expect(genBad.statusCode).toBe(400);

    // evaluate-open sin studentAnswer
    const evalBad = await request(app)
      .post("/api/evaluate-open")
      .send({ text: "Algo de texto" });
    expect(evalBad.statusCode).toBe(400);
  });
});
