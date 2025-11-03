// controllers/evaluateController.js
import { ollamaRequest } from "../utils/ollamaClient.js";

export async function evaluateOpen(req, res) {
  const { text, studentAnswer } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Debe enviarse el texto base para evaluar." });
  }

  if (!studentAnswer || !studentAnswer.trim()) {
    return res.status(400).json({ error: "Debe escribirse una respuesta del estudiante para evaluar." });
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

Responde **solo en JSON válido** con esta estructura exacta:
{
"score": número del 0 al 20,
"feedback": "Retroalimentación breve (máx. 3 oraciones), indicando comprensión, errores ortográficos o de coherencia."
}
`;
    const output = await ollamaRequest(prompt);

    try {
      const parsed = JSON.parse(output.trim());
      return res.json(parsed);
    } catch {
      console.error("⚠️ No fue JSON válido:", output);
      return res.status(502).json({
        error: "La respuesta del modelo no fue válida.",
        raw: output,
      });
    }
  } catch (err) {
    console.error("❌ Error con Ollama:", err.message);
    res.status(500).json({ error: "Error interno al evaluar resumen." });
  }
}
