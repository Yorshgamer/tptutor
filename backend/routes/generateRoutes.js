import { Router } from "express";
import { generateQA } from "../controllers/generateController.js";
const router = Router();
router.post("/", generateQA);
export default router;
