const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Ruta de prueba
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend 🚀" });
});

// Ruta para generar preguntas
app.post("/generate-questions", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "El texto es requerido" });
  }

  try {
    // Usar Hugging Face API para generar preguntas
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
      }
    );

    const questions = response.data;
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar preguntas" });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
