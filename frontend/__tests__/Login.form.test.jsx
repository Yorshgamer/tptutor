// __tests__/Login.form.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../src/pages/Login";

// 🔹 Mock global fetch para evitar llamadas reales al backend
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          user: { name: "Tester", email: "test@example.com" },
        }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("✅ Login Form (actual)", () => {
  test("permite escribir y enviar el formulario, mostrando mensaje de éxito", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Campos accesibles
    const emailInput = screen.getByLabelText(/correo/i);
    const passInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /entrar/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passInput, "123456");

    await user.click(submitBtn);

    // Espera a que el mensaje aparezca (fetch mock devuelve success)
    await waitFor(() =>
      expect(
        screen.getByText(/inicio de sesión exitoso/i)
      ).toBeInTheDocument()
    );

    // Confirma que localStorage se haya escrito
    const saved = localStorage.getItem("user");
    expect(saved).toContain("test@example.com");
  });

  test("muestra mensaje de error si fetch devuelve error", async () => {
    // Mock para fallo del servidor
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Credenciales incorrectas" }),
    });

    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/correo/i);
    const passInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /entrar/i });

    await user.type(emailInput, "bad@example.com");
    await user.type(passInput, "wrong123");
    await user.click(submitBtn);

    await waitFor(() =>
      expect(
        screen.getByText(/credenciales incorrectas/i)
      ).toBeInTheDocument()
    );
  });
});
