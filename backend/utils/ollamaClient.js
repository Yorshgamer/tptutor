// utils/ollamaClient.js (ESM)
export async function ollamaRequest(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma:2b", // 👈 asegúrate que este modelo existe en `ollama list`
      prompt,
      stream: false,     // 👈 SIN streaming
      // sin format:"json" → nos devuelve texto normal
    }),
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`Error de Ollama (${response.status}): ${txt}`);
  }

  const data = await response.json(); // { model, created_at, response, done, ... }

  const out = data.response || "";
  return String(out).trim(); // siempre devolvemos string
}
