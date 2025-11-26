// routes/projectRoutes.js
import { Router } from "express";
import { z } from "zod";
import { Project } from "../models/Project.js";
import { auth } from "./authRoutes.js"; // tu middleware existente
import { TutorAssignment } from "../models/TutorAssignment.js";

const router = Router();
const upsertSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional().default(""),
  status: z.enum(["pending","in_progress","done"]).optional().default("in_progress"),
  tags: z.array(z.string()).optional().default([]),
});

// Listar solo los del usuario (alumno). Si rol=teacher y quieres ver todos, usa query ?all=1.
router.get("/", auth, async (req, res) => {
  try {
    const { q = "", status = "all", all, ownerId } = req.query;

    let baseFilter = {};

    // 🧑‍🎓 Estudiante (o cualquier usuario sin "all=1"): solo sus propios proyectos
    if (req.user.role === "student" || !all) {
      baseFilter = { ownerId: req.user.id };
    }
    // 👨‍🏫 Teacher/Admin con all=1 => solo proyectos de alumnos que tutoriza
    else if (all && (req.user.role === "teacher" || req.user.role === "admin")) {
      const links = await TutorAssignment.find({ teacherId: req.user.id }).select("studentId");
      const allowedIds = links.map((l) => l.studentId.toString());

      if (!allowedIds.length) {
        return res.json({ ok: true, data: [] });
      }

      // Si viene ownerId en query, comprobamos que esté asignado
      if (ownerId) {
        const ownerIdStr = ownerId.toString();
        if (!allowedIds.includes(ownerIdStr)) {
          return res.status(403).json({ ok: false, error: "FORBIDDEN_STUDENT" });
        }
        baseFilter = { ownerId: ownerIdStr };
      } else {
        baseFilter = { ownerId: { $in: allowedIds } };
      }
    }

    const filter = { ...baseFilter };

    if (status !== "all") {
      filter.status = status;
    }

    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const items = await Project.find(filter).sort({ updatedAt: -1 });
    res.json({ ok: true, data: items });
  } catch (err) {
    console.error("Error en GET /api/projects:", err);
    res.status(500).json({ ok: false, error: "SERVER" });
  }
});


router.post("/", auth, async (req, res) => {
  const data = upsertSchema.parse(req.body);
  const created = await Project.create({ ...data, ownerId: req.user.id });
  res.status(201).json({ ok: true, data: created });
});

router.get("/:id", auth, async (req, res) => {
  const found = await Project.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!found) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  res.json({ ok: true, data: found });
});

router.patch("/:id", auth, async (req, res) => {
  const patch = upsertSchema.partial().parse(req.body);
  const updated = await Project.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    { ...patch },
    { new: true }
  );
  if (!updated) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  res.json({ ok: true, data: updated });
});

router.delete("/:id", auth, async (req, res) => {
  const gone = await Project.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
  if (!gone) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  res.json({ ok: true });
});

export default router;