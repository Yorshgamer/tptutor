// __tests__/SideNav.unit.test.jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SideNav from "../src/components/SideNav";

describe("✅ SideNav Component", () => {
  test("renderiza todos los enlaces de navegación", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /inicio|home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /proyectos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tutor/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login|iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear cuenta|register/i })).toBeInTheDocument();
  });

  test("tiene role navigation (accesible)", () => {
    render(
      <MemoryRouter>
        <SideNav />
      </MemoryRouter>
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
