exports.ollamaRequest = async (prompt) => {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gemma:2b", prompt }),
  });

  const rawData = await response.text();

  try {
    const lines = rawData
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    return lines.map((l) => l.response).join("");
  } catch (err) {
    throw new Error("Respuesta inválida de Ollama: " + err.message);
  }
};
