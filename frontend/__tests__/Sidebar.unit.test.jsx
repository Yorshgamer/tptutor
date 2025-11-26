// __tests__/Sidebar.unit.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../src/components/Sidebar";
import AuthProvider from "../src/auth/AuthProvider";

function getMobileAside() {
  // Hay dos: aside de escritorio (md:block) y aside móvil (md:hidden)
  const all = screen.queryAllByLabelText("Menú lateral");
  return all.find((el) => el.className.includes("md:hidden")) || null;
}

describe("✅ Sidebar Component", () => {
  test("open=false: el aside móvil existe pero está oculto (-translate-x-full) y no hay overlay; el nav de escritorio sí está", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar open={false} onClose={jest.fn()} />
        </AuthProvider>
      </MemoryRouter>
    );

    // Aside móvil presente pero oculto por clase
    const asideMobile = getMobileAside();
    expect(asideMobile).toBeTruthy();
    expect(asideMobile).toHaveClass("-translate-x-full");
    expect(asideMobile).not.toHaveClass("translate-x-0");

    // No hay overlay cuando está cerrado
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeNull();

    // El nav de escritorio SÍ existe siempre
    expect(
      screen.getByRole("navigation", { name: /navegación lateral/i })
    ).toBeInTheDocument();
  });

  test("open=true: aparece/visible el aside móvil", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar open={true} onClose={jest.fn()} />
        </AuthProvider>
      </MemoryRouter>
    );

    const asideMobile = getMobileAside();
    expect(asideMobile).toBeTruthy();
    expect(asideMobile).toHaveClass("translate-x-0");
    expect(asideMobile).not.toHaveClass("-translate-x-full");
  });

  test("ejecuta onClose al hacer clic en el overlay (aria-hidden='true')", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar open={true} onClose={onClose} />
        </AuthProvider>
      </MemoryRouter>
    );

    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeTruthy();

    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("ejecuta onClose al hacer clic en un enlace del menú móvil", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <Sidebar open={true} onClose={onClose} />
        </AuthProvider>
      </MemoryRouter>
    );

    const links = screen.getAllByRole("link");
    await user.click(links[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
