// __tests__/Register.page.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../src/pages/Register";
import AuthProvider from "../src/auth/AuthProvider";

jest.setTimeout(30000); // 💡 evita timeouts en Docker

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          message: "Usuario registrado con éxito ✅",
        }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("🧾 Register Form (actual)", () => {
  test("renderiza correctamente", () => {
    renderRegister();
    expect(
      screen.getByRole("button", { name: /registrarme/i })
    ).toBeInTheDocument();
  });

  test("❌ muestra error si las contraseñas no coinciden", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre/i), "Test User");
    await user.type(screen.getByLabelText(/correo/i), "test@example.com");
    await user.type(
      screen.getByLabelText(/contraseña/i, { selector: "#p1" }),
      "clave123"
    );
    await user.type(screen.getByLabelText(/confirmar/i), "clave_diferente");
    await user.click(
      screen.getByRole("button", { name: /registrarme/i })
    );

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
  });

  test("✅ realiza registro exitoso con datos válidos", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
    await user.type(screen.getByLabelText(/correo/i), "nuevo@example.com");
    await user.type(
      screen.getByLabelText(/contraseña/i, { selector: "#p1" }),
      "123456"
    );
    await user.type(screen.getByLabelText(/confirmar/i), "123456");
    await user.click(
      screen.getByRole("button", { name: /registrarme/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/usuario registrado con éxito/i)
      ).toBeInTheDocument()
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  test("⚠️ muestra error si fetch devuelve error", async () => {
    // Mock fallo
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Correo ya registrado" }),
    });

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/nombre/i), "User Error");
    await user.type(screen.getByLabelText(/correo/i), "bad@example.com");
    await user.type(
      screen.getByLabelText(/contraseña/i, { selector: "#p1" }),
      "123456"
    );
    await user.type(screen.getByLabelText(/confirmar/i), "123456");
    await user.click(
      screen.getByRole("button", { name: /registrarme/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/correo ya registrado/i)
      ).toBeInTheDocument()
    );
  });
});
