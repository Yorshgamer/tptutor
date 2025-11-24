// controllers/evaluateController.js
import { ollamaRequest } from "../utils/ollamaClient.js";

/**
 * Intenta extraer un objeto JSON de forma tolerante desde un string.
 * - Busca el primer "{"
 * - Busca el último "}"
 * - Si no hay "}", asume que falta y la agrega
 */
export function extractJsonObjectLenient(str) {
  const trimmed = String(str || "").trim();
  if (!trimmed) return null;

  const start = trimmed.indexOf("{");
  if (start === -1) {
    // No hay ni una llave → imposible
    return null;
  }

  let end = trimmed.lastIndexOf("}");

  let candidate;
  if (end === -1) {
    // No hay "}" → asumimos que faltó la llave de cierre
    candidate = trimmed.slice(start) + "}";
  } else {
    candidate = trimmed.slice(start, end + 1);
  }

  try {
    const obj = JSON.parse(candidate);
    return obj;
  } catch (e) {
    console.error("❗ No se pudo parsear ni siquiera el candidate:", e.message);
    console.error("Candidate problemático:", candidate);
    return null;
  }
}

export async function evaluateOpen(req, res) {
  const { text, studentAnswer } = req.body || {};

  if (!text || !text.trim()) {
    return res
      .status(400)
      .json({ error: "Debe enviarse el texto base para evaluar." });
  }

  if (!studentAnswer || !studentAnswer.trim()) {
    return res.status(400).json({
      error: "Debe escribirse una respuesta del estudiante para evaluar.",
    });
  }

  try {
    const prompt = `
Evalúa la siguiente respuesta de un estudiante según el texto dado.

TEXTO BASE:
${text}

RESPUESTA DEL ESTUDIANTE:
${studentAnswer}

Criterios:
1. Comprensión lectora: ¿responde al contenido del texto?
2. Coherencia: ¿las ideas tienen sentido o están fuera de contexto?
3. Ortografía y redacción: ¿hay errores graves o leves?
4. Profundidad: ¿solo repite o muestra análisis?

Guía para puntuar (sé exigente):
- 0-5: No entiende el texto o responde algo sin sentido. Ej: "Me gusta el sol porque es bonito."
- 6-10: Menciona algo del texto, pero con errores o frases sin sentido.
- 11-15: Entiende parcialmente el texto, pero con errores de redacción u ortografía.
- 16-20: Entiende claramente, redacta bien y reflexiona sobre el texto.

👉 Ejemplos:
Texto: "El sol brilla y los niños juegan en el parque."
Mala respuesta: "El sol está triste." → Puntaje: 4 (no tiene relación)
Regular: "Habla del sol y los niños." → Puntaje: 10
Buena: "El texto muestra alegría en un día soleado." → Puntaje: 17

Responde *solo en JSON válido* con esta estructura exacta:
{
  "score": número del 0 al 20,
  "feedback": "Retroalimentación breve (máx. 3 oraciones), indicando comprensión, errores ortográficos o de coherencia."
}
`.trim();

    const output = await ollamaRequest(prompt);
    const raw = String(output || "").trim();

    // 1) Intento directo
    try {
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch {
      console.warn("⚠️ JSON.parse directo falló en evaluateOpen, intentando lenient…");
    }

    // 2) Intento lenient (arreglar llave faltante o texto extra)
    const obj = extractJsonObjectLenient(raw);
    if (obj && typeof obj.score === "number" && typeof obj.feedback === "string") {
      return res.json(obj);
    }

    // 3) Nada funcionó → devolvemos raw para debug
    console.error("⚠️ No fue JSON válido:", raw);
    return res.status(502).json({
      error: "La respuesta del modelo no fue válida.",
      raw,
    });
  } catch (err) {
    console.error("❌ Error con Ollama:", err.message || err);
    res
      .status(500)
      .json({ error: "Error interno al evaluar resumen." });
  }
}
