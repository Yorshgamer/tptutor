const { ollamaRequest } = require("../utils/ollamaClient");

// 🔧 Mock del fetch global
global.fetch = jest.fn();

describe("🤖 ollamaRequest util", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ procesa correctamente la respuesta del servidor", async () => {
    const fakeResponse = [
      JSON.stringify({ response: "Hola " }),
      JSON.stringify({ response: "mundo" }),
    ].join("\n");

    // Mock del objeto Response
    global.fetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue(fakeResponse),
    });

    const result = await ollamaRequest("prompt de prueba");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(result).toBe("Hola mundo");
  });

  test("⚠️ lanza error si fetch falla", async () => {
    global.fetch.mockRejectedValue(new Error("falló la conexión"));

    await expect(ollamaRequest("algo")).rejects.toThrow("falló la conexión");
  });

  test("❌ lanza error si la respuesta no es JSON válida", async () => {
    const invalidResponse = "Esto no es JSON\n{malformed}";
    global.fetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue(invalidResponse),
    });

    await expect(ollamaRequest("test")).rejects.toThrow();
  });
});
