// src/utils/n8nClient.js
import fetch from "node-fetch";

export async function notifyReadingCompleted({ project, student, result, progress }) {
  const url = process.env.N8N_WEBHOOK_READING_COMPLETED;
  if (!url) {
    console.warn("N8N_WEBHOOK_READING_COMPLETED no está configurado");
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "reading_completed",
        projectId: project._id.toString(),
        projectName: project.name,
        studentId: student?._id?.toString(),
        studentName: student?.name || "Estudiante",
        studentEmail: student?.email || null,
        mcScore: result.mcScore,
        openScore: result.openScore,
        totalScore: result.totalScore,
        passed: result.passed,
        progress,
        createdAt: result.createdAt,
      }),
    });
  } catch (err) {
    console.error("⚠️ Error notificando a n8n:", err.message);
  }
}
