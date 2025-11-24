// controllers/readingResultController.js
import { z } from "zod";
import { Project } from "../models/Project.js";
import { ReadingActivity } from "../models/ReadingActivity.js";
import { ReadingResult } from "../models/ReadingResult.js";
import { User } from "../models/User.js";
import { notifyReadingCompleted } from "../utils/n8nClient.js"; // ajusta la ruta según tu estructura

// Validación del cuerpo del POST
const resultSchema = z.object({
  projectId: z.string().min(1),
  activityId: z.string().min(1),
  mcScore: z.number().min(0).max(20),
  openScore: z.number().min(0).max(20),
  reflection: z.string().optional().default(""),
  rawText: z.string().min(1),
  answers: z.any().optional(),
});

/**
 * Recalcula el progreso del proyecto (totalActivities, completedActivities, progressPercent)
 * para UN alumno en ese proyecto.
 */
async function recalcProjectProgress(projectId, studentId) {
  // Total de actividades del proyecto
  const totalActivities = await ReadingActivity.countDocuments({ projectId });

  // Actividades aprobadas por el estudiante (distinct activityId)
  const passedActivitiesIds = await ReadingResult.distinct("activityId", {
    projectId,
    studentId,
    passed: true,
  });

  const completedActivities = passedActivitiesIds.length;
  const progressPercent =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  await Project.findByIdAndUpdate(projectId, {
    totalActivities,
    completedActivities,
    progressPercent,
  });

  return { totalActivities, completedActivities, progressPercent };
}

/**
 * POST /api/reading-results
 * Guarda un intento de lectura y actualiza el progreso del proyecto.
 */
export async function createReadingResult(req, res) {
  try {
    const data = resultSchema.parse(req.body);
    const studentId = req.user.id; // viene del token (auth middleware)

    // 1) Verificar proyecto
    const project = await Project.findById(data.projectId);
    if (!project) {
      return res.status(404).json({ ok: false, error: "PROJECT_NOT_FOUND" });
    }

    const student = await User.findById(studentId).select("name email");
    // Solo el dueño del proyecto (alumno) puede guardar su resultado por ahora
    if (project.ownerId.toString() !== studentId) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN_PROJECT" });
    }

    // 2) Buscar o crear actividad de lectura
    // Usamos activityId como _id string (ej: "6913...-lectura-1")
    let activity = await ReadingActivity.findById(data.activityId);

    if (!activity) {
      activity = await ReadingActivity.create({
        _id: data.activityId,
        projectId: data.projectId,
        title: "Lectura crítica 1", // puedes personalizar luego
        minScore: 5,
      });
    }

    // 3) Calcular puntaje total
    const totalScore = Math.round((data.mcScore + data.openScore) / 2);
    const minScore = activity.minScore ?? 5;
    const passed = totalScore >= minScore;

    // 4) Crear el resultado
    const result = await ReadingResult.create({
      activityId: data.activityId, // lo guardamos tal cual llegó
      projectId: data.projectId,
      studentId,
      mcScore: data.mcScore,
      openScore: data.openScore,
      totalScore,
      reflection: data.reflection,
      rawText: data.rawText,
      answers: data.answers,
      passed,
    });

    // 5) Recalcular progreso
    const progress = await recalcProjectProgress(data.projectId, studentId);

    // 👉 Avisamos a n8n (opcional: sólo si pasó)
    if (passed) {
      notifyReadingCompleted({ project, student, result, progress });
    }

    return res.status(201).json({
      ok: true,
      data: {
        result,
        progress,
      },
    });
  } catch (err) {
    // 🔍 Si es error de Zod, mostramos detalles claros
    if (err instanceof z.ZodError) {
      console.error("❌ Error de validación en /api/reading-results:");
      console.error(JSON.stringify(err.issues, null, 2));

      return res.status(400).json({
        ok: false,
        error: "VALIDATION",
        message: "Datos inválidos al crear el resultado de lectura.",
        issues: err.issues, // 👈 aquí vienen los detalles (path, message, etc.)
      });
    }

    // Otros errores (Mongo, lógica, etc.)
    console.error("Error en createReadingResult:", err);
    return res.status(500).json({ ok: false, error: "SERVER" });
  }
}
