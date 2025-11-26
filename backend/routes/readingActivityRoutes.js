// routes/readingActivityRoutes.js
import { Router } from "express";
import { auth } from "./authRoutes.js";
import {
  createReadingActivity,
  listReadingActivities,
} from "../controllers/readingActivityController.js";

const router = Router();

// Todas requieren estar autenticado
router.post("/", auth, createReadingActivity);
router.get("/", auth, listReadingActivities);

export default router;
