// __tests__/SideNav.unit.test.jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../src/auth/AuthProvider";
import SideNav from "../src/components/SideNav";

describe("✅ SideNav Component", () => {
  function renderWithProviders() {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <SideNav />
        </AuthProvider>
      </MemoryRouter>
    );
  }

  test("renderiza todos los enlaces de navegación", () => {
    renderWithProviders();

    expect(screen.getByRole("link", { name: /inicio|home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /proyectos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tutor/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login|iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear cuenta|register/i })).toBeInTheDocument();
  });

  test("tiene role navigation (accesible)", () => {
    renderWithProviders();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
