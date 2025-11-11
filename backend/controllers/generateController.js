// controllers/generateController.js
import { ollamaRequest } from "../utils/ollamaClient.js";

export async function generateQA(req, res) {
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
Cada pregunta debe tener 4 respuestas posibles y un campo "feedback".

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
    const output = await ollamaRequest(prompt);

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
}
