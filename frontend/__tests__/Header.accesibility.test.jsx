// __tests__/Header.accesibility.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../src/auth/AuthProvider";
import Header from "../src/components/Header";

test("Header tiene botón accesible para abrir menú", async () => {
  const user = userEvent.setup();
  const onToggleSidebar = jest.fn();

  render(
    <MemoryRouter>
      <AuthProvider>
        <Header onToggleSidebar={onToggleSidebar} />
      </AuthProvider>
    </MemoryRouter>
  );

  const btn = screen.getByRole("button", { name: /menu|abrir/i });
  expect(btn).toBeInTheDocument();

  await user.click(btn);
  expect(onToggleSidebar).toHaveBeenCalled();
});
