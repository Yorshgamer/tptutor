// routes/projectRoutes.js
import { Router } from "express";
import { z } from "zod";
import { Project } from "../models/Project.js";
import { auth } from "./authRoutes.js"; // tu middleware existente

const router = Router();
const upsertSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional().default(""),
  status: z.enum(["pending","in_progress","done"]).optional().default("in_progress"),
  tags: z.array(z.string()).optional().default([]),
});

// Listar solo los del usuario (alumno). Si rol=teacher y quieres ver todos, usa query ?all=1.
router.get("/", auth, async (req, res) => {
  const { q = "", status = "all", all } = req.query;
  const base = (all && (req.user.role === "teacher" || req.user.role === "admin"))
    ? {} : { ownerId: req.user.id };

  const filter = {
    ...base,
    ...(status !== "all" ? { status } : {}),
    ...(q ? { $or: [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
      { tags: { $in: [new RegExp(q, "i")] } }
    ] } : {})
  };

  const items = await Project.find(filter).sort({ updatedAt: -1 });
  res.json({ ok: true, data: items });
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