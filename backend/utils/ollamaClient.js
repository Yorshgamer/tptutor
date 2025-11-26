// utils/ollamaClient.js (versión más robusta)
const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function ollamaRequest(prompt) {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma:2b",
      prompt,
      stream: false,
    }),
  });

  // Robustecer manejo de error: status puede no existir en mocks
  if (!response.ok) {
    const txt = await (response.text ? response.text().catch(() => "") : Promise.resolve(""));
    const status = response.status ?? "unknown";
    throw new Error(`Error de Ollama (${status}): ${txt}`);
  }

  const data = await response.json();
  const out = data.response ?? "";
  return String(out).trim();
}
