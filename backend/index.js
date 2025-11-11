// index.js (ESM)
import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectMongo, handleProcessSignals } from "./src/db/mongoose.js";

// OJO: agrega siempre la extensión .js en imports locales en ESM
import uploadRoutes from "./routes/uploadRoutes.js";
import evaluateRoutes from "./routes/evaluateRoutes.js";
import generateRoutes from "./routes/generateRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

// Monta rutas
app.use("/api/upload", uploadRoutes);
app.use("/api/evaluate-open", evaluateRoutes);
app.use("/api/generate-qa", generateRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teacher", teacherRoutes);
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

const PORT = process.env.PORT || 5000;

try {
  await connectMongo();
  handleProcessSignals();
  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () =>
      console.log(`API en http://localhost:${PORT} (env=${process.env.NODE_ENV})`)
    );
  }
} catch (err) {
  console.error("Error conectando a Mongo:", err);
  process.exit(1);
}

export default app;
