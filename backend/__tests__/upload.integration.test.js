const request = require("supertest");
const express = require("express");
const uploadRoutes = require("../routes/uploadRoutes");
const mammoth = require("mammoth");

jest.mock("mammoth", () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: "Texto del .docx" }),
}));

const app = express();
app.use("/api/upload", uploadRoutes);

describe("🚀 /api/upload endpoint (integration)", () => {
  test("✅ procesa un archivo DOCX simulado", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("file", Buffer.from("fake docx content"), "test.docx");

    expect(res.statusCode).toBe(200);
    expect(res.body.text).toContain("Texto del .docx");
  });

  test("❌ devuelve 400 si no se envía archivo", async () => {
    const res = await request(app).post("/api/upload");
    expect(res.statusCode).toBe(400);
  });
});
