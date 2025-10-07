// __tests__/Login.form.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../src/pages/Login";

describe("✅ Login Form", () => {
  test("permite escribir y enviar el formulario sin crashear", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Campos (label accesible; si tu form usa 'Email'/'Correo' y 'Password'/'Contraseña', estos matchers lo capturan)
    const emailInput = screen.getByLabelText(/correo|email/i);
    const passInput  = screen.getByLabelText(/contraseña|password/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passInput, "Secreto123!");

    // Botón de envío: intenta cubrir variantes comunes
    const submitBtn = screen.getByRole("button", {
      name: /iniciar sesión|login|entrar/i,
    });

    await user.click(submitBtn);

    // Aserción mínima de smoke: el botón sigue en el documento (no crasheó el render)
    expect(submitBtn).toBeInTheDocument();
  });
});
