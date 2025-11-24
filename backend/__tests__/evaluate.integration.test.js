// __tests__/evaluate.routes.test.js
import request from "supertest";
import express from "express";
import evaluateRoutes from "../routes/evaluateRoutes.js"; 

// 1. Mockeamos el controlador. 
// No necesitamos 'ollamaClient' aquí, porque eso es detalle interno del controlador.
// Solo nos importa que el controlador responda ALGO para saber que la ruta conectó.
jest.mock("../controllers/evaluateController.js", () => ({
  evaluateOpen: jest.fn((req, res) => {
    return res.status(200).json({ 
      mocked: true, 
      message: "Soy el controlador mockeado" 
    });
  }),
}));

const app = express();
app.use(express.json());
app.use("/api/evaluate-open", evaluateRoutes);

describe("🚦 /api/evaluate-open Routes", () => {
  
  test("✅ POST / debería delegar al controlador evaluateOpen y devolver 200", async () => {
    const res = await request(app)
      .post("/api/evaluate-open")
      .send({
        text: "Texto de prueba",
        studentAnswer: "Respuesta de prueba",
      });

    // Verificamos que Express ruteó correctamente
    expect(res.statusCode).toBe(200);
    
    // Verificamos que realmente se ejecutó nuestro mock
    expect(res.body).toEqual({ 
      mocked: true, 
      message: "Soy el controlador mockeado" 
    });
  });

  // Opcional: Probar que 404 funciona para otros verbos no definidos
  test("🚫 GET / debería devolver 404 (método no permitido/definido)", async () => {
    const res = await request(app).get("/api/evaluate-open");
    expect(res.statusCode).toBe(404);
  });
});