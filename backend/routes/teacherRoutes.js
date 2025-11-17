// routes/teacherRoutes.js
import { Router } from "express";
import { auth } from "./authRoutes.js";
import { User } from "../models/User.js";
import { TutorAssignment } from "../models/TutorAssignment.js";

const router = Router();

function requireTeacher(req, res, next) {
  if (req.user?.role === "teacher" || req.user?.role === "admin") return next();
  return res.status(403).json({ ok: false, error: "FORBIDDEN" });
}

/**
 * GET /api/teacher/students
 * Devuelve estudiantes + flag assigned (si el profesor actual los tutoriza)
 */
router.get("/students", auth, requireTeacher, async (req, res) => {
  const q = (req.query.q || "").toString().trim();

  const filter = { role: "student" };
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
    ];
  }

  const students = await User.find(filter).select("_id name email role");

  const links = await TutorAssignment.find({ teacherId: req.user.id }).select("studentId");
  const assignedSet = new Set(links.map((l) => l.studentId.toString()));

  const data = students.map((s) => ({
    id: s._id.toString(),
    name: s.name,
    email: s.email,
    assigned: assignedSet.has(s._id.toString()),
  }));

  res.json({ ok: true, data });
});

/**
 * POST /api/teacher/students/:studentId
 * Asignar un alumno a este profesor
 */
router.post("/students/:studentId", auth, requireTeacher, async (req, res) => {
  const { studentId } = req.params;

  const student = await User.findOne({ _id: studentId, role: "student" });
  if (!student) {
    return res.status(404).json({ ok: false, error: "STUDENT_NOT_FOUND" });
  }

  await TutorAssignment.findOneAndUpdate(
    { teacherId: req.user.id, studentId },
    {},
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ ok: true });
});

/**
 * DELETE /api/teacher/students/:studentId
 * Quitar un alumno de la tutoría de este profesor
 */
router.delete("/students/:studentId", auth, requireTeacher, async (req, res) => {
  const { studentId } = req.params;
  await TutorAssignment.findOneAndDelete({ teacherId: req.user.id, studentId });
  res.json({ ok: true });
});

export default router;
