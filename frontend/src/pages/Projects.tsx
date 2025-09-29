import React, { useState } from "react";
import Card from "../components/Card";
import Tag from "../components/Tag";
import Button from "../components/Button";

interface QAResult {
  question: string;
  answer: string;
}

export default function Projects() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QAResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const resp = await fetch("/api/generate-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data: QAResult[] = await resp.json();
      if (!resp.ok) throw new Error((data as any).error || "Error en la API");

      setResults(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Generador de Preguntas" subtitle="Sube un texto y obtén preguntas con sus respuestas">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          rows={6}
          placeholder="Pega aquí el texto del profesor..."
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Generando..." : "Generar Preguntas"}
          </Button>
        </div>
      </Card>

      {error && (
        <Card>
          <p className="text-red-600">⚠️ {error}</p>
        </Card>
      )}

      {results.length > 0 && (
        <Card title="Resultados">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Pregunta</th>
                  <th className="py-2">Respuesta</th>
                </tr>
              </thead>
              <tbody className="align-top text-slate-800">
                {results.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-3 pr-4 font-medium">{item.question}</td>
                    <td className="py-3">{item.answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}