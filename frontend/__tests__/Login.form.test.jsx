// __tests__/Login.form.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../src/pages/Login";
import AuthProvider from "../src/auth/AuthProvider";

jest.setTimeout(30000);

// 🔹 Mock global fetch por defecto (login exitoso)
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          user: { name: "Tester", email: "test@example.com" },
          message: "Inicio de sesión exitoso ✅",
        }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("✅ Login Form (actual)", () => {
  test("permite escribir y enviar el formulario, mostrando mensaje de éxito", async () => {
    const user = userEvent.setup();
    renderLogin();

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
    // 🔁 Sobrescribimos SOLO para este test
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Credenciales incorrectas" }),
    });

    const user = userEvent.setup();
    renderLogin();

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
