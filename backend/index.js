require("dotenv").config();
const express = require("express");
const cors = require("cors");

// importa tu conector
const { connectMongo, handleProcessSignals } = require("./src/db/mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ... tus rutas actuales
// app.use("/api/upload", uploadRoutes);
// app.use("/api/evaluate-open", evaluateRoutes);
// app.use("/api/generate-qa", generateRoutes);
// app.use("/api/users", userRoutes);

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectMongo();
    handleProcessSignals();

    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
    }
  } catch (err) {
    console.error("Error conectando a Mongo:", err);
    process.exit(1);
  }
})();

module.exports = app;
