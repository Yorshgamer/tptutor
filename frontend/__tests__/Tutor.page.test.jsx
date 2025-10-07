// __tests__/Tutor.page.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tutor from "../src/pages/Tutor";

describe("✅ Tutor Page - flujo principal", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    global.fetch = jest.fn(async (url) => {
      const u = typeof url === "string" ? url : "";

      if (u.includes("/api/upload")) {
        return { ok: true, json: async () => ({ text: "Texto desde DOCX" }) };
      }

      if (u.includes("/api/generate-qa")) {
        return {
          ok: true,
          json: async () => [
            {
              question: "¿Capital de Francia?",
              answers: [
                { text: "Madrid", correct: false },
                { text: "París", correct: true },
                { text: "Roma", correct: false },
              ],
              feedback: "París es la capital.",
            },
          ],
        };
      }

      if (u.includes("/api/evaluate-open")) {
        return {
          ok: true,
          json: async () => ({
            score: 18,
            feedback: "Excelente reflexión, muy clara.",
          }),
        };
      }

      return { ok: false, json: async () => ({ error: "Ruta no mockeada" }) };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test(
    "genera preguntas y evalúa resumen correctamente",
    async () => {
      render(<Tutor />);

      // 1️⃣ Texto base
      const textarea = screen.getByPlaceholderText(/pega aquí un texto/i);
      await user.type(
        textarea,
        "Texto de ejemplo con suficiente longitud para probar la generación de preguntas."
      );

      // 2️⃣ Click en generar
      await user.click(
        screen.getByRole("button", { name: /generar preguntas/i })
      );

      // 3️⃣ Espera la pregunta generada
      await waitFor(() =>
        expect(screen.getByText(/capital de francia/i)).toBeInTheDocument()
      );

      // 4️⃣ Selecciona París
      const radios = screen.getAllByRole("radio");
      await user.click(radios[1]);

      // 5️⃣ Verificar respuestas
      await user.click(
        screen.getByRole("button", { name: /verificar respuestas/i })
      );

      await waitFor(() =>
        expect(screen.getByText(/correcto/i)).toBeInTheDocument()
      );

      // 6️⃣ Escribir reflexión larga
      const openTextarea = screen.getByPlaceholderText(/escribe aquí tu resumen/i);
      await user.type(
        openTextarea,
        "Esta es una reflexión bastante extensa que supera los 50 caracteres y demuestra comprensión crítica del texto."
      );

      await user.click(
        screen.getByRole("button", { name: /evaluar resumen/i })
      );

      // 7️⃣ Espera evaluación mockeada
      await waitFor(() =>
        expect(screen.getByText(/puntaje:\s*18\s*\/\s*20/i)).toBeInTheDocument()
      );
      expect(screen.getByText(/excelente reflexión/i)).toBeInTheDocument();
    },
    25000 // 🔥 más tiempo solo para este test
  );
});
