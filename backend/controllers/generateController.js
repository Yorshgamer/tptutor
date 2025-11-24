// controllers/generateController.js
import { ollamaRequest } from "../utils/ollamaClient.js";
// 🔧 Normaliza y limpia las preguntas que vienen del modelo
function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .filter((q) => q && typeof q === "object")
    .map((q) => {
      const questionText =
        typeof q.question === "string" ? q.question.trim() : "";

      // Normalizamos answers:
      let answers = [];

      if (Array.isArray(q.answers)) {
        answers = q.answers
          .map((a) => {
            if (typeof a === "string") {
              return { text: a, correct: false };
            }
            if (a && typeof a === "object") {
              return {
                text: typeof a.text === "string" ? a.text : "",
                correct: Boolean(a.correct),
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // Si no hay respuestas, dejamos array vacío para que el front muestre el mensaje
      if (answers.length === 0) {
        return {
          question: questionText || "Pregunta sin texto",
          answers: [],
          feedback:
            typeof q.feedback === "string" ? q.feedback : "Sin feedback.",
        };
      }

      // Aseguramos que haya AL MENOS una respuesta correcta
      const hasCorrect = answers.some((a) => a.correct);
      if (!hasCorrect) {
        answers[0].correct = true;
      }

      return {
        question: questionText || "Pregunta sin texto",
        answers,
        feedback:
          typeof q.feedback === "string" ? q.feedback : "Sin feedback.",
      };
    });
}
// helpers para tests: extraer objetos desde un string y procesarlos (usa la misma lógica interna)
export function parseObjectBlocksAndNormalize(trimmed) {
  // trimmed: string (ya .trim())
  const objectMatches = trimmed.match(/\{[\s\S]*?\}/g);
  if (objectMatches && objectMatches.length > 0) {
    const questions = [];
    for (const objStr of objectMatches) {
      try {
        const q = JSON.parse(objStr);
        questions.push(q);
      } catch (e) {
        // Esta es la línea que queremos cubrir en tests: console.warn(...)
        console.warn("❗ No se pudo parsear un bloque:", e.message);
      }
    }
    if (questions.length > 0) {
      const norm = normalizeQuestions(questions);
      return norm;
    }
  }
  return null;
}

export async function generateQA(req, res) {
  const { text, count } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "El campo 'text' es requerido" });
  }

  const numQuestions = count && !isNaN(count) ? parseInt(count) : 3;

  try {
    const prompt = `
Eres un generador de preguntas de comprensión lectora.

A partir del siguiente texto:

${text}

Genera exactamente ${numQuestions} preguntas de opción múltiple.
Cada pregunta debe tener exactamente 4 respuestas posibles y un campo "feedback".

RESPONDE SOLO con JSON VÁLIDO, sin texto adicional. Puedes responder:
- Como un array de preguntas: [ { ... }, { ... } ]
- O como varios objetos uno debajo de otro:
  { ... }
  { ... }
`.trim();

    const output = await ollamaRequest(prompt); // 🔹 siempre string
    const trimmed = output.trim();

    // 1) Intento directo: ¿es un array JSON completo?
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const norm = normalizeQuestions(parsed);
        return res.json(norm);
      }
      if (typeof parsed === "object" && parsed !== null) {
        const norm = normalizeQuestions([parsed]);
        return res.json(norm);
      }
    } catch {
      // seguimos probando abajo
    }

    // 2) Buscar un array dentro del string (por si vino texto antes o después)
    const startArr = trimmed.indexOf("[");
    const endArr = trimmed.lastIndexOf("]");
    if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
      const slice = trimmed.slice(startArr, endArr + 1);
      try {
        const parsed = JSON.parse(slice);
        if (Array.isArray(parsed)) {
          const norm = normalizeQuestions(parsed);
          return res.json(norm);
        }
      } catch {
        // seguimos al siguiente intento
      }
    }

    // 3) Caso como el que mostraste:
    // { ... }
    // { ... }
    const objectMatches = trimmed.match(/\{[\s\S]*?\}/g);
    if (objectMatches && objectMatches.length > 0) {
      const questions = [];
      for (const objStr of objectMatches) {
        try {
          const q = JSON.parse(objStr);
          questions.push(q);
        } catch (e) {
          console.warn("❗ No se pudo parsear un bloque:", e.message);
        }
      }
      if (questions.length > 0) {
        const norm = normalizeQuestions(questions);
        return res.json(norm);
      }
    }

    // 4) Si nada funcionó, mandamos raw al front para debug
    console.error("⚠️ Salida STRING no fue JSON parseable:", trimmed);
    return res.json({ raw: trimmed });
  } catch (err) {
    console.error("❌ Error con Ollama:", err);
    return res
      .status(500)
      .json({ error: "Error al generar preguntas con el modelo." });
  }
}
