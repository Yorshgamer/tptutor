const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

// Generar preguntas y respuestas con Ollama (Gemma 2B)
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
Marca la respuesta correcta con "correct": true y las incorrectas con "correct": false.

Responde SOLO en formato JSON válido, con esta estructura:

[
  {
    "question": "¿...?",
    "answers": [
      {"text": "...", "correct": true},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false}
    ]
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
    const lines = rawData.trim().split("\n").map(l => JSON.parse(l));
    const output = lines.map(l => l.response).join("");

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
