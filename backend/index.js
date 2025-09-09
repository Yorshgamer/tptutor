// backend/index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const MODEL = process.env.QG_MODEL || "iarfmoose/t5-base-question-generator";
const HF_URL = (model) => `https://api-inference.huggingface.co/models/${model}`;

if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn("⚠️ WARNING: HUGGINGFACE_API_KEY no encontrado en .env. Las llamadas fallarán.");
}

// Ruta de prueba
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

app.post("/generate-questions", async (req, res) => {
  const { text, answer } = req.body || {};
  if (!text || !text.toString().trim()) {
    return res.status(400).json({ error: "El campo 'text' es requerido" });
  }

  // Construir input para modelo QG-HL si hay answer
  // Si no hay answer, intentamos un fallback (prefijo) — puede funcionar con otros modelos.
  let input;
  if (answer && answer.toString().trim()) {
    input = `<hl> ${answer.toString().trim()} <hl> ${text.toString().trim()} </s>`;
  } else {
    // Fallback: algunos modelos aceptan "generate question: <context>"
    input = `generate question: ${text.toString().trim()}`;
  }

  console.log(">>> generate-questions request:", {
    model: MODEL,
    text_preview: text.toString().slice(0, 200),
    answer: answer ? answer.toString().slice(0, 80) : null,
  });
  console.log(">>> constructed input (preview):", input.slice(0, 300));

  try {
    const hfResp = await axios.post(
      HF_URL(MODEL),
      { inputs: input },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        timeout: 120000,
      }
    );

    console.log("HF response status:", hfResp.status);
    // hfResp.data puede ser array, objeto con generated_text o string
    const data = hfResp.data;
    let questions = [];

    if (Array.isArray(data)) {
      questions = data.map((x) => x.generated_text || x);
    } else if (data && typeof data === "object" && data.generated_text) {
      questions = [data.generated_text];
    } else if (typeof data === "string") {
      questions = [data];
    } else {
      questions = [JSON.stringify(data)];
    }

    console.log("Questions parsed:", questions.slice(0, 10));
    return res.json({ questions });
  } catch (err) {
    // Logs útiles para debug
    console.error("ERROR calling HF:", err.response?.status, err.response?.data || err.message || err);
    // enviar info útil al frontend (NO tu api key)
    const details = err.response?.data || err.message;
    return res.status(500).json({ error: "Error al generar preguntas", details });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
