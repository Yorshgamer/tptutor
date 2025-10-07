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
  feedback?: string;
}

export default function Tutor() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(3);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingEvaluate, setLoadingEvaluate] = useState(false);
  const [errorGenerate, setErrorGenerate] = useState("");
  const [errorEvaluate, setErrorEvaluate] = useState("");
  const [errorUpload, setErrorUpload] = useState("");
  const [results, setResults] = useState<QAResult[]>([]);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [openEval, setOpenEval] = useState<{
    score: number;
    feedback: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorGenerate("Debes ingresar un texto.");
      return;
    }

    setLoadingGenerate(true);
    setErrorGenerate("");
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
        setErrorGenerate("Formato inesperado de respuesta.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorGenerate("Error al generar preguntas: " + err.message);
      } else {
        setErrorGenerate("Error desconocido al generar preguntas.");
      }
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleVerify = () => {
    const newFeedback: Record<number, string> = {};
    let correctCount = 0;

    results.forEach((qa, i) => {
      const selected = selectedAnswers[i];
      if (selected !== null && qa.answers[selected]?.correct) {
        newFeedback[i] = "¡Correcto! 🎉 " + (qa.feedback || "");
        correctCount++;
      } else {
        // Mostrar cuál era la correcta
        const correctAns = qa.answers.find((a) => a.correct)?.text || "Respuesta no encontrada";
        newFeedback[i] = `❌ Incorrecto. La respuesta correcta era: "${correctAns}". ${qa.feedback || ""}`;
      }
    });

    setFeedback(newFeedback);

    // Calcular puntaje proporcional a 20
    const total = results.length;
    const scoreCalc = Math.round((correctCount / total) * 20);
    setScore(scoreCalc);
  };

  // 📂 Subir archivo Word
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const resp = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (resp.ok && data.text) {
        setText(data.text);
        setErrorUpload("");
      } else {
        setErrorUpload(data.error || "Error al procesar archivo.");
      }
    } catch (err: any) {
      setErrorUpload("Error al subir archivo: " + err.message);
    }
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subir archivo Word (.docx)
              </label>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-600 
               file:mr-4 file:py-2 file:px-4 
               file:rounded-lg file:border-0 
               file:text-sm file:font-semibold 
               file:bg-blue-600 file:text-white 
               hover:file:bg-blue-700 cursor-pointer"
              />
              {errorUpload && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errorUpload}</p>
              )}
            </div>

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
                disabled={loadingGenerate}
                className="min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
              >
                {loadingGenerate ? (
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

          {errorGenerate && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{errorGenerate}</p>
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
                    className={`ml-9 p-3 rounded-lg ${feedback[i].includes("🎉")
                      ? "bg-green-50 border border-green-200"
                      : "bg-orange-50 border border-orange-200"
                      }`}
                  >
                    <p
                      className={`font-semibold ${feedback[i].includes("🎉")
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

      {score !== null && (
        <Card className="p-4 border-l-4 border-l-purple-500 bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-700">
            🎯 Tu puntaje: {score} / 20
          </h3>
        </Card>
      )}

      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          📝 Escribe una reflexión crítica
        </label>

        <textarea
          rows={4}
          className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none shadow-sm"
          placeholder="Escribe aquí tu resumen..."
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
        />

        {/* Contador dinámico de caracteres */}
        <div className="flex justify-between items-center mt-2">
          <p
            className={`text-sm font-medium ${openAnswer.trim().length === 0
                ? "text-slate-400"
                : openAnswer.trim().length < 50
                  ? "text-orange-500"
                  : "text-green-600"
              }`}
          >
            {openAnswer.trim().length} / 50 caracteres mínimos
          </p>
          {openAnswer.trim().length > 0 && openAnswer.trim().length < 50 && (
            <p className="text-orange-500 text-xs font-medium">
              ⚠️ Escribe un poco más para una evaluación precisa.
            </p>
          )}
        </div>

        <Button
          onClick={async () => {
            // Limpiar estados anteriores
            setErrorEvaluate("");
            setOpenEval(null);

            // ⚙️ Validaciones antes de enviar
            if (!text.trim()) {
              setErrorEvaluate("⚠️ Debes ingresar o subir un texto base antes de evaluar.");
              return;
            }

            if (!openAnswer.trim()) {
              setErrorEvaluate("⚠️ Debes escribir tu reflexión antes de evaluar.");
              return;
            }

            if (openAnswer.trim().length < 50) {
              setErrorEvaluate("⚠️ Tu reflexión debe tener al menos 50 caracteres para una evaluación adecuada.");
              return;
            }

            setLoadingEvaluate(true);

            try {
              const resp = await fetch("/api/evaluate-open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, studentAnswer: openAnswer }),
              });

              const data = await resp.json();

              if (!resp.ok) {
                throw new Error(data.error || "Error al evaluar resumen.");
              }

              setOpenEval(data);
            } catch (err: any) {
              setErrorEvaluate(err.message || "Error desconocido al evaluar.");
            } finally {
              setLoadingEvaluate(false);
            }
          }}
          disabled={loadingEvaluate || openAnswer.trim().length < 50}
          className={`mt-3 min-w-[160px] ${openAnswer.trim().length < 50
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            } text-white shadow-sm transition-all duration-200`}
        >
          {loadingEvaluate ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Evaluando...
            </span>
          ) : (
            "📖 Evaluar resumen"
          )}
        </Button>

        {/* Mensaje de error si ocurre algo */}
        {errorEvaluate && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{errorEvaluate}</p>
          </div>
        )}

        {/* Resultado de la evaluación */}
        {openEval && (
          <div className="mt-3 p-4 border-l-4 border-l-purple-500 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-700 text-lg">
              🎯 Puntaje: {openEval.score} / 20
            </p>
            <p className="text-slate-700 mt-2">{openEval.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
