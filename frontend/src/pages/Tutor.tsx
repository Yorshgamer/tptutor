import React, { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

interface Answer {
  text: string;
  correct: boolean;
}

interface QAResult {
  question: string;
  answers: Answer[];
}

export default function Tutor() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<QAResult[]>([]);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Debes ingresar un texto.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setRawOutput(null);
    setSelectedAnswers({});
    setFeedback({});

    try {
      const resp = await fetch("/api/generate-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, count }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error en la API");

      if (Array.isArray(data)) {
        setResults(data);
      } else if (data.raw) {
        setRawOutput(data.raw);
      } else {
        setError("Formato inesperado de respuesta.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Error al generar preguntas: " + err.message);
      } else {
        setError("Error desconocido al generar preguntas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    const newFeedback: Record<number, string> = {};
    results.forEach((qa, i) => {
      const selected = selectedAnswers[i];
      if (selected !== null && qa.answers[selected]?.correct) {
        newFeedback[i] = "¡Correcto! 🎉";
      } else {
        newFeedback[i] = "Incorrecto. Sigue intentando 💪";
      }
    });
    setFeedback(newFeedback);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Card
        title="Tutor de Lectura Crítica"
        subtitle="Carga un texto y genera preguntas con respuestas usando Gemma 2B en Ollama"
        className="shadow-lg border-0"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Texto a analizar
            </label>
            <textarea
              rows={6}
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none shadow-sm"
              placeholder="Pega aquí un texto para generar preguntas…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">
                Número de preguntas:
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ⏳ Generando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    📄 Generar preguntas
                  </span>
                )}
              </Button>

              {results.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleVerify}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm"
                >
                  ✅ Verificar respuestas
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((qa, i) => (
            <Card
              key={i}
              className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="font-semibold text-slate-800 text-lg leading-relaxed">
                    {qa.question}
                  </p>
                </div>

                <ul className="space-y-2 ml-9">
                  {qa.answers.map((ans, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-150"
                    >
                      <input
                        type="radio"
                        name={`question-${i}`}
                        value={j}
                        checked={selectedAnswers[i] === j}
                        onChange={() =>
                          setSelectedAnswers((prev) => ({ ...prev, [i]: j }))
                        }
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 flex-1">{ans.text}</span>
                    </li>
                  ))}
                </ul>

                {feedback[i] && (
                  <div
                    className={`ml-9 p-3 rounded-lg ${
                      feedback[i].includes("🎉")
                        ? "bg-green-50 border border-green-200"
                        : "bg-orange-50 border border-orange-200"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        feedback[i].includes("🎉")
                          ? "text-green-700"
                          : "text-orange-700"
                      }`}
                    >
                      {feedback[i]}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {rawOutput && (
        <Card className="bg-slate-900 text-slate-100 border-0">
          <h3 className="text-lg font-semibold mb-3 text-slate-100">
            Salida del modelo
          </h3>
          <pre className="whitespace-pre-wrap text-sm bg-slate-800 p-4 rounded-lg overflow-x-auto">
            {rawOutput}
          </pre>
        </Card>
      )}
    </div>
  );
}
