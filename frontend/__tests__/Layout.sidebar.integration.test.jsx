// __tests__/Layout.sidebar.integration.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Layout from "../src/components/Layout";

// Mock mínimo del Header para exponer el botón accesible
jest.mock("../src/components/Header", () => ({
  __esModule: true,
  default: ({ onToggleSidebar }) => (
    <header>
      <button onClick={onToggleSidebar} aria-label="Abrir menú">Abrir menú</button>
    </header>
  ),
}));

function getMobileAside() {
  // Hay dos asides: uno de escritorio (md:block) y uno móvil (md:hidden).
  // Filtramos por la clase "md:hidden".
  const all = screen.queryAllByLabelText("Menú lateral");
  return all.find((el) => el.className.includes("md:hidden")) || null;
}

describe("✅ Layout Sidebar Integration", () => {
  test("abre el sidebar móvil al hacer clic en el botón del header", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Layout><p>Contenido principal</p></Layout>
      </MemoryRouter>
    );

    // El aside móvil existe pero está oculto con '-translate-x-full'
    const asideMobile = getMobileAside();
    expect(asideMobile).toBeTruthy();
    expect(asideMobile).toHaveClass("-translate-x-full");

    // Abrir
    await user.click(screen.getByRole("button", { name: /abrir menú/i }));

    // Espera a que cambie la clase (animación/estado)
    await waitFor(() => {
      expect(getMobileAside()).toHaveClass("translate-x-0");
      expect(getMobileAside()).not.toHaveClass("-translate-x-full");
    });
  });

  test("cierra el sidebar móvil al hacer clic en el overlay", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Layout><p>Contenido principal</p></Layout>
      </MemoryRouter>
    );

    // Abrir primero
    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    await waitFor(() => {
      expect(getMobileAside()).toHaveClass("translate-x-0");
    });

    // El overlay no tiene testid; se selecciona por aria-hidden
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeTruthy();

    // 👇 sin cast de TypeScript (archivo .jsx)
    await user.click(overlay);

    // Debe volver a ocultarse
    await waitFor(() => {
      expect(getMobileAside()).toHaveClass("-translate-x-full");
      expect(getMobileAside()).not.toHaveClass("translate-x-0");
    });
  });
});
