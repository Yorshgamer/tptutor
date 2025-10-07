const express = require("express");
const cors = require("cors");
const uploadRoutes = require("./routes/uploadRoutes");
const evaluateRoutes = require("./routes/evaluateRoutes");
const generateRoutes = require("./routes/generateRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/evaluate-open", evaluateRoutes);
app.use("/api/generate-qa", generateRoutes);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);

module.exports = app;
