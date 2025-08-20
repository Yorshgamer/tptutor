import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  const handleGenerateQuestions = async () => {
    if (!text.trim()) {
      setError("Por favor, ingresa un texto.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/generate-questions",
        { text }
      );
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError("Error al generar preguntas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Frontend con React+Vite</h1>
      <p>Mensaje del backend: {message}</p>
      <h1>Tutor Virtual de Lectura Crítica</h1>
      <textarea
        placeholder="Ingresa el texto aquí..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows="6"
        cols="50"
      />
      <br />
      <button onClick={handleGenerateQuestions} disabled={loading}>
        {loading ? "Generando..." : "Generar Preguntas"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        <h2>Preguntas Generadas:</h2>
        {questions.length > 0 ? (
          <ul>
            {questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        ) : (
          <p>No hay preguntas generadas aún.</p>
        )}
      </div>
    </div>
  );
}

export default App;
