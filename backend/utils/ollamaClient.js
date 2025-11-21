// utils/ollamaClient.js (ESM)
const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function ollamaRequest(prompt) {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma:2b", // asegúrate que existe en `ollama list`
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`Error de Ollama (${response.status}): ${txt}`);
  }

  const data = await response.json();
  const out = data.response || "";
  return String(out).trim();
}
