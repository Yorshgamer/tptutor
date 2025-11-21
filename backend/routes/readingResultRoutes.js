// routes/readingResultRoutes.js
import { Router } from "express";
import { auth } from "./authRoutes.js";
import { createReadingResult } from "../controllers/readingResultController.js";

const router = Router();

router.post("/", auth, createReadingResult);

export default router;
