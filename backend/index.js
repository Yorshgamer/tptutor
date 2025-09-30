const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mammoth = require("mammoth");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" }); // carpeta temporal para subir archivos

// Ruta de prueba
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

// 📂 Subir archivo y extraer texto (solo DOCX)
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: req.file.path });
      fs.unlinkSync(req.file.path); // eliminar archivo temporal
      return res.json({ text: result.value.trim() });
    } else {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ error: "Formato no soportado. Solo DOCX" });
    }
  } catch (err) {
    console.error("❌ Error procesando DOCX:", err.message);
    res.status(500).json({ error: "Error procesando archivo" });
  }
});

// 📝 Evaluar pregunta abierta / resumen
app.post("/api/evaluate-open", async (req, res) => {
  const { text, studentAnswer } = req.body || {};
  if (!text || !studentAnswer || !studentAnswer.trim()) {
    return res.status(400).json({ error: "Falta texto o respuesta del estudiante" });
  }

  try {
    const prompt = `
Texto base:
${text}

Respuesta del estudiante:
${studentAnswer}

Evalúa si el estudiante comprendió críticamente el texto.
1. Asigna un puntaje de 0 a 20.
2. Da una retroalimentación breve (máx. 3 oraciones).

Responde en formato JSON:
{
  "score": 0-20,
  "feedback": "..."
}
`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt,
      }),
    });

    const rawData = await response.text();
    const lines = rawData.trim().split("\n").map((l) => JSON.parse(l));
    const output = lines.map((l) => l.response).join("");

    try {
      const parsed = JSON.parse(output.trim());
      return res.json(parsed);
    } catch {
      console.error("⚠️ No fue JSON válido:", output);
      return res.json({ raw: output });
    }
  } catch (err) {
    console.error("❌ Error con Ollama:", err.message);
    res.status(500).json({ error: "Error al evaluar resumen" });
  }
});


// 🤖 Generar preguntas y respuestas con Ollama (Gemma 2B)
app.post("/api/generate-qa", async (req, res) => {
  const { text, count } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "El campo 'text' es requerido" });
  }

  const numQuestions = count && !isNaN(count) ? parseInt(count) : 3;

  try {
    const prompt = `
A partir del siguiente texto:

${text}

Genera ${numQuestions} preguntas de opción múltiple para evaluar comprensión lectora.
Cada pregunta debe tener 4 respuestas posibles.
Además, para cada pregunta incluye un campo "feedback" con retroalimentación breve para el alumno.

Responde SOLO en formato JSON válido, con esta estructura:

[
  {
    "question": "¿...?",
    "answers": [
      {"text": "...", "correct": true},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false}
    ],
    "feedback": "..."
  }
]
`;


    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:2b",
        prompt,
      }),
    });

    // 👇 leer como texto plano
    const rawData = await response.text();

    // Ollama manda NDJSON → separar líneas y parsear
    const lines = rawData.trim().split("\n").map((l) => JSON.parse(l));
    const output = lines.map((l) => l.response).join("");

    // Intentar parsear como JSON estructurado
    try {
      const parsed = JSON.parse(output.trim());
      return res.json(parsed);
    } catch {
      console.error("⚠️ Salida no fue JSON:", output);
      return res.json({ raw: output });
    }
  } catch (err) {
    console.error("❌ Error con Ollama:", err.message);
    res.status(500).json({ error: "Error al generar preguntas" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
