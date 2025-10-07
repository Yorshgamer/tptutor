const request = require("supertest");
const express = require("express");
const evaluateRoutes = require("../routes/evaluateRoutes");

jest.mock("../utils/ollamaClient", () => ({
  ollamaRequest: jest.fn().mockResolvedValue(
    JSON.stringify({
      score: 19,
      feedback: "Excelente análisis del texto.",
    })
  ),
}));

const app = express();
app.use(express.json());
app.use("/api/evaluate-open", evaluateRoutes);

describe("🚀 /api/evaluate-open endpoint", () => {
  test("✅ responde con score y feedback válidos", async () => {
    const res = await request(app)
      .post("/api/evaluate-open")
      .send({
        text: "El sol brilla en lo alto.",
        studentAnswer: "Habla sobre el sol brillando y la naturaleza.",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("score");
    expect(res.body).toHaveProperty("feedback");
  });

  test("❌ responde con 400 si falta texto base", async () => {
    const res = await request(app)
      .post("/api/evaluate-open")
      .send({ studentAnswer: "Algo" });

    expect(res.statusCode).toBe(400);
  });
});
