const request = require("supertest");
const express = require("express");
const generateRoutes = require("../routes/generateRoutes");

jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn().mockResolvedValue(
    JSON.stringify([
      {
        question: "¿Qué hizo María?",
        answers: [
          { text: "Salió a caminar", correct: true },
          { text: "Durmió", correct: false },
          { text: "Comió", correct: false },
          { text: "Leyó", correct: false },
        ],
        feedback: "Bien.",
      },
    ])
  ),
}));

const app = express();
app.use(express.json());
app.use("/api/generate-qa", generateRoutes);

describe("🚀 /api/generate-qa (integration)", () => {
  test("✅ 200 y devuelve array de preguntas", async () => {
    const res = await request(app)
      .post("/api/generate-qa")
      .send({ text: "Texto base", count: 3 });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("question");
    expect(res.body[0]).toHaveProperty("answers");
  });

  test("❌ 400 si no envían 'text'", async () => {
    const res = await request(app)
      .post("/api/generate-qa")
      .send({ count: 2 });
    expect(res.statusCode).toBe(400);
  });
});
