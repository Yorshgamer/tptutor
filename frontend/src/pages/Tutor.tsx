import React, { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import axios from "axios";

export default function Tutor() {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");

  const handleGenerate = async () => {
    if (!text.trim()) {
    setError("Debes ingresar un texto.");
    return;
  }
  if (!answer.trim()) {
    setError("Debes ingresar una respuesta para resaltar.");
    return;
  }

    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const res = await axios.post("http://localhost:5000/generate-questions", {
        text,
      answer, // ✅ ahora sí mandamos la respuesta
    });
      
      // Algunos modelos devuelven array, otros objetos → ajustamos
      const data = res.data.questions;
      const formatted =
        Array.isArray(data) ? data.map((q: any) => q.generated_text || q) : [];

      setQuestions(formatted);
    } catch (err:any) {
  console.error("Frontend error:", err);
  const serverMsg = err.response?.data;
  const msg = serverMsg?.details || serverMsg?.error || err.message || "Error al generar preguntas.";
  setError("Error al generar preguntas: " + msg);
}
 finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Tutor de Lectura Crítica" subtitle="Carga un texto y evalúa">
        <input
          className="w-full rounded-2xl border border-slate-200 p-2 text-sm mt-3"
          placeholder="Respuesta que quieres resaltar en el texto"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Texto a analizar
        </label>
        <textarea
          rows={6}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Pega aquí un texto para generar preguntas y evaluar comprensión…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "⏳ Generando..." : "📄 Generar preguntas"}
          </Button>
          <Button variant="secondary">✅ Evaluar</Button>
        </div>

        {/* Mostrar errores */}
        {error && <p className="text-red-600 mt-3">{error}</p>}

        {/* Mostrar preguntas generadas */}
        {questions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-semibold">Preguntas generadas:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {questions.map((q, i) => (
                <li key={i} className="text-slate-700">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
