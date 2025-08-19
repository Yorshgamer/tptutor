const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors()); // Permitir requests desde React
app.use(express.json());

// Ruta de prueba
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
