// controllers/readingActivityController.js
import { z } from "zod";
import { ReadingActivity } from "../models/ReadingActivity.js";

// Esquema de validación para crear actividad
const createActivitySchema = z.object({
  projectId: z.string().min(1),
  activityId: z.string().min(1), // usaremos esto como _id string
  title: z.string().min(1),
  minScore: z.number().min(0).max(20).optional(), // mínimo aprobatorio
});

/**
 * POST /api/reading-activities
 * Crea una actividad de lectura asociada a un proyecto.
 */
export async function createReadingActivity(req, res) {
  try {
    const data = createActivitySchema.parse(req.body);

    // Creamos la actividad usando activityId como _id (string)
    const activity = await ReadingActivity.create({
      _id: data.activityId,            // 👈 IMPORTANTE: usamos el string enviado
      projectId: data.projectId,
      title: data.title,
      minScore: data.minScore ?? 14,
    });

    return res.status(201).json({
      ok: true,
      data: activity,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("❌ Error de validación en createReadingActivity:");
      console.error(JSON.stringify(err.issues, null, 2));
      return res.status(400).json({
        ok: false,
        error: "VALIDATION",
        message: "Datos inválidos al crear actividad de lectura.",
        issues: err.issues,
      });
    }

    console.error("❌ Error en createReadingActivity:", err);
    return res.status(500).json({ ok: false, error: "SERVER" });
  }
}

/**
 * (Opcional) GET /api/reading-activities?projectId=...
 * Para listar actividades de un proyecto.
 */
export async function listReadingActivities(req, res) {
  try {
    const { projectId } = req.query;

    const filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }

    const items = await ReadingActivity.find(filter).lean();

    return res.json({
      ok: true,
      data: items,
    });
  } catch (err) {
    console.error("❌ Error en listReadingActivities:", err);
    return res.status(500).json({ ok: false, error: "SERVER" });
  }
}
