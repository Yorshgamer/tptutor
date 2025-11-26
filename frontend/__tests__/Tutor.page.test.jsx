// __tests__/Tutor.page.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Tutor from "../src/pages/Tutor";

describe("✅ Tutor Page - cobertura completa de flujos y errores", () => {
  const user = userEvent.setup();
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  test(
    "1) Flujo feliz: genera preguntas, verifica y evalúa resumen",
    async () => {
      // Mock: upload OK, generate-qa OK (1 pregunta), evaluate-open OK
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

      render(<Tutor />);

      // Texto base
      const baseTextarea = screen.getByPlaceholderText(/pega aquí un texto/i);
      await user.type(
        baseTextarea,
        "Texto de ejemplo con suficiente longitud para probar la generación."
      );

      // Generar preguntas
      await user.click(screen.getByRole("button", { name: /generar preguntas/i }));

      // Aparece la pregunta
      expect(await screen.findByText(/capital de francia/i)).toBeInTheDocument();

      // Seleccionamos la correcta (París)
      const radios = screen.getAllByRole("radio");
      await user.click(radios[1]);

      // Verificar respuestas
      await user.click(screen.getByRole("button", { name: /verificar respuestas/i }));
      await waitFor(() => expect(screen.getByText(/¡correcto!/i)).toBeInTheDocument());

      // Debe mostrar el puntaje /20
      expect(screen.getByText(/tu puntaje:\s*20\s*\/\s*20/i)).toBeInTheDocument();

      // Evaluación abierta (>= 50 chars)
      const openTextarea = screen.getByPlaceholderText(/escribe aquí tu resumen/i);
      await user.type(
        openTextarea,
        "Esta es una reflexión extensa que supera los 50 caracteres para evaluar correctamente."
      );

      await user.click(screen.getByRole("button", { name: /evaluar resumen/i }));

      // Puntaje y feedback mockeado
      expect(await screen.findByText(/puntaje:\s*18\s*\/\s*20/i)).toBeInTheDocument();
      expect(screen.getByText(/excelente reflexión/i)).toBeInTheDocument();
    },
    25000
  );

  test("2) Validación: intentar generar sin texto base", async () => {
    global.fetch = jest.fn(); // no debería llamarse generate-qa

    render(<Tutor />);

    // Click en generar sin texto
    await user.click(screen.getByRole("button", { name: /generar preguntas/i }));

    // Mensaje real de la UI
    expect(await screen.findByText(/debes ingresar un texto/i)).toBeInTheDocument();

    // Aseguramos que NO se llamó al endpoint
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("3) Error de /api/generate-qa muestra alerta de error", async () => {
    // Con texto base, pero el endpoint responde error
    global.fetch = jest.fn(async (url) => {
      if (typeof url === "string" && url.includes("/api/generate-qa")) {
        return {
          ok: false,
          json: async () => ({ error: "Fallo al generar" }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<Tutor />);

    const baseTextarea = screen.getByPlaceholderText(/pega aquí un texto/i);
    await user.type(baseTextarea, "Texto base para intentar generar.");

    await user.click(screen.getByRole("button", { name: /generar preguntas/i }));

    // La UI muestra: "Error al generar preguntas: <mensaje>"
    expect(await screen.findByText(/error al generar preguntas/i)).toBeInTheDocument();
  });

  test("4) Evaluación abierta: mínimos/UI y error del endpoint", async () => {
    // Mock POR URL: evaluate-open SIEMPRE error; lo demás OK
    global.fetch = jest.fn(async (url) => {
      const u = typeof url === "string" ? url : "";

      if (u.includes("/api/evaluate-open")) {
        return {
          ok: false,
          json: async () => ({ error: "Fallo al evaluar resumen." }),
        };
      }

      // Resto de endpoints, OK vacíos
      return { ok: true, json: async () => ({}) };
    });

    render(<Tutor />);

    const baseTextarea = screen.getByPlaceholderText(/pega aquí un texto/i);
    const openTextarea = screen.getByPlaceholderText(/escribe aquí tu resumen/i);
    const evalBtn = screen.getByRole("button", { name: /evaluar resumen/i });

    // --- Reflexión corta: botón deshabilitado ---
    await user.type(openTextarea, "Muy corta");
    expect(evalBtn).toBeDisabled();
    expect(screen.getByText(/50 caracteres mínimos/i)).toBeInTheDocument();

    // --- Reflexión larga SIN texto base: debe mostrar error de base ---
    await user.clear(openTextarea);
    await user.type(
      openTextarea,
      "Ahora la hago muy larga para superar con holgura el mínimo de 50 caracteres."
    );
    expect(evalBtn).not.toBeDisabled();

    await user.click(evalBtn);
    // Mensaje: "⚠️ Debes ingresar o subir un texto base antes de evaluar."
    expect(await screen.findByText(/ingresar.*texto base.*evaluar/i)).toBeInTheDocument();

    // --- Ahora con texto base y reflexión larga -> error del endpoint ---
    await user.type(baseTextarea, "Texto base presente.");
    await user.click(evalBtn);

    // Mensaje de error del endpoint (punto opcional)
    expect(await screen.findByText(/fallo al evaluar resumen\.?/i)).toBeInTheDocument();
  });

  // 🔒 En tu UI, "Evaluar resumen" arranca DESHABILITADO. Verificamos eso.
  test("deshabilita 'Evaluar resumen' cuando no hay texto en el resumen", async () => {
    const user = userEvent.setup();
    render(<Tutor />);

    const evalBtn = screen.getByRole("button", { name: /evaluar resumen/i });
    expect(evalBtn).toBeDisabled();

    // Al escribir en el textarea, se habilita
    const openTextarea = screen.getByPlaceholderText(/escribe aquí tu resumen/i);
    await user.type(openTextarea, "Algo de texto");
    expect(evalBtn).not.toBeDisabled();
  });

  // ❌ Error en /api/generate-qa: tu UI muestra "Error al generar preguntas: <msg>"
  test("muestra error si /api/generate-qa responde con ok:false", async () => {
    const user = userEvent.setup();

    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (url) => {
      const u = typeof url === "string" ? url : "";
      if (u.includes("/api/generate-qa")) {
        return { ok: false, json: async () => ({ error: "Fallo generando preguntas" }) };
      }
      if (u.includes("/api/upload")) {
        return { ok: true, json: async () => ({ text: "Texto cualquiera" }) };
      }
      if (u.includes("/api/evaluate-open")) {
        return { ok: true, json: async () => ({ score: 15, feedback: "ok" }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<Tutor />);

    const txt = screen.getByPlaceholderText(/pega aquí un texto/i);
    await user.type(txt, "Texto mínimo para probar error en generate-qa");
    await user.click(screen.getByRole("button", { name: /generar preguntas/i }));

    // Usa un selector más específico para NO coincidir con el textarea
    expect(
      await screen.findByText(/Error al generar preguntas:\s*Fallo generando preguntas/i)
    ).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  // ❌ Error en /api/evaluate-open: tu UI no muestra un texto de error claro, así que comprobamos
  //    que NO aparece un puntaje numérico y que al menos se invocó el endpoint.
  test("no muestra puntaje numérico si /api/evaluate-open falla (pero invoca el endpoint)", async () => {
    const user = userEvent.setup();

    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (url) => {
      const u = typeof url === "string" ? url : "";

      if (u.includes("/api/generate-qa")) {
        return {
          ok: true,
          json: async () => ([
            { question: "Q1", answers: [{ text: "A", correct: true }], feedback: "ok" },
          ]),
        };
      }
      if (u.includes("/api/evaluate-open")) {
        return { ok: false, json: async () => ({ error: "Fallo evaluando" }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<Tutor />);

    // Genera preguntas
    const texto = screen.getByPlaceholderText(/pega aquí un texto/i);
    await user.type(texto, "Algo");
    await user.click(screen.getByRole("button", { name: /generar preguntas/i }));
    await screen.findByText("Q1");

    // Escribe resumen y evalúa (con error del backend)
    const openTextarea = screen.getByPlaceholderText(/escribe aquí tu resumen/i);
    await user.type(openTextarea, "Mi resumen");
    await user.click(screen.getByRole("button", { name: /evaluar resumen/i }));

    // Se invocó el endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/evaluate-open/),
        expect.objectContaining({ method: "POST" })
      );
    });

    // No aparece un puntaje numérico tipo "17 / 20"
    expect(screen.queryByText(/Puntaje:\s*\d+\s*\/\s*20/i)).toBeNull();

    global.fetch = originalFetch;
  });
});
