import { Router } from "express";
import { evaluateOpen } from "../controllers/evaluateController.js"; // <-- import nombrado

const router = Router();
router.post("/", evaluateOpen);

export default router;
