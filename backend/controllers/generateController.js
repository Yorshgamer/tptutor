import { ollamaRequest } from "../utils/ollamaClient.js";

// 🔧 Normaliza y limpia las preguntas que vienen del modelo
function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .filter((q) => q && typeof q === "object")
    .map((q) => {
      const questionText = typeof q.question === "string" ? q.question.trim() : "";

      let answers = [];
      if (Array.isArray(q.answers)) {
        answers = q.answers
          .map((a) => {
            if (typeof a === "string") return { text: a, correct: false };
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

      if (answers.length === 0) {
        return {
          question: questionText || "Pregunta sin texto",
          answers: [],
          feedback: typeof q.feedback === "string" ? q.feedback : "Sin feedback.",
        };
      }

      const hasCorrect = answers.some((a) => a.correct);
      if (!hasCorrect) {
        answers[0].correct = true;
      }

      return {
        question: questionText || "Pregunta sin texto",
        answers,
        feedback: typeof q.feedback === "string" ? q.feedback : "Sin feedback.",
      };
    });
}

// 🔧 Helper exportado para tests y para uso interno
export function parseObjectBlocksAndNormalize(trimmed) {
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
      return normalizeQuestions(questions);
    }
  }
  return null;
}

export async function generateQA(req, res) {
  // REFACTOR: Destructuring seguro y simple para evitar ramas fantasma
  const body = req.body || {};
  const { text, count } = body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "El campo 'text' es requerido" });
  }

  const numQuestions = count && !isNaN(count) ? parseInt(count) : 3;

  try {
    const prompt = `
Eres un generador de preguntas.
Texto: ${text}
Genera ${numQuestions} preguntas.
JSON ONLY.
`.trim();

    const output = await ollamaRequest(prompt); 
    const trimmed = String(output || "").trim();

    // 1) Intento directo (Array u Objeto único)
    try {
      const parsed = JSON.parse(trimmed);
      // Caso A: Array directo
      if (Array.isArray(parsed)) {
        return res.json(normalizeQuestions(parsed));
      }
      // Caso B: Objeto único directo (Línea 69 cubierta si testeamos esto)
      if (typeof parsed === "object" && parsed !== null) {
        return res.json(normalizeQuestions([parsed]));
      }
    } catch {
      // Fallo JSON directo, seguimos... (Línea 77 cubierta implícitamente)
    }

    // 2) Buscar Array [...] dentro del texto
    const startArr = trimmed.indexOf("[");
    const endArr = trimmed.lastIndexOf("]");
    
    // Validamos lógica de índices
    if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
      const slice = trimmed.slice(startArr, endArr + 1);
      try {
        const parsed = JSON.parse(slice);
        if (Array.isArray(parsed)) {
          return res.json(normalizeQuestions(parsed));
        }
      } catch {
        // Fallo slice, seguimos...
      }
    }

    // 3) Buscar bloques { ... } (Usa el helper para DRY)
    const fromBlocks = parseObjectBlocksAndNormalize(trimmed);
    if (fromBlocks) {
      return res.json(fromBlocks);
    }

    // 4) Fallback final (Línea 151)
    console.error("⚠️ Salida STRING no fue JSON parseable:", trimmed);
    return res.json({ raw: trimmed });

  } catch (err) {
    console.error("❌ Error con Ollama:", err);
    return res.status(500).json({ error: "Error al generar preguntas con el modelo." });
  }
}

import { Router } from "express";
// No olvides importar generateQA usando import nombrado para mantener consistencia
// (Aunque en tu archivo original ya estaba bien)
// import { generateQA } from "../controllers/generateController.js"; 
// PERO como estamos en el mismo archivo para el copy-paste:
const router = Router();
router.post("/", generateQA);
export default router;