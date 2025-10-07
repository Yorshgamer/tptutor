// __tests__/Routes.rendering.test.jsx
import { render, screen, act, cleanup } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { router } from "../src/routes/Router";

// Mock Layout para asertos estables
jest.mock("../src/components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="layout-wrapper">
      <header>MockLayout</header>
      <main>{children}</main>
    </div>
  ),
}));

// Mock de páginas
jest.mock("../src/pages/Home",     () => ({ __esModule: true, default: () => <h1>HomePage</h1> }));
jest.mock("../src/pages/Projects", () => ({ __esModule: true, default: () => <h1>ProjectsPage</h1> }));
jest.mock("../src/pages/Tutor",    () => ({ __esModule: true, default: () => <h1>TutorPage</h1> }));
jest.mock("../src/pages/Login",    () => ({ __esModule: true, default: () => <h1>LoginPage</h1> }));
jest.mock("../src/pages/Register", () => ({ __esModule: true, default: () => <h1>RegisterPage</h1> }));

afterEach(() => {
  cleanup();
});

describe("✅ Router principal", () => {
  test("Renderiza Home en '/'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate("/");
    });
    expect(screen.getByTestId("layout-wrapper")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HomePage" })).toBeInTheDocument();
  });

  test("Renderiza Login en '/login'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate("/login");
    });
    expect(screen.getByTestId("layout-wrapper")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "LoginPage" })).toBeInTheDocument();
  });

  test("Renderiza Projects en '/projects'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate("/projects");
    });
    expect(screen.getByRole("heading", { name: "ProjectsPage" })).toBeInTheDocument();
  });

  test("Renderiza Tutor en '/tutor'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate("/tutor");
    });
    expect(screen.getByRole("heading", { name: "TutorPage" })).toBeInTheDocument();
  });

  test("Renderiza Register en '/register'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate("/register");
    });
    expect(screen.getByRole("heading", { name: "RegisterPage" })).toBeInTheDocument();
  });

  test("Renderiza página 404 para rutas desconocidas", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.navigate("/no-existe");
    });
    // Ajusta los textos al NotFound de tu Router.tsx
    expect(screen.getByText(/página no encontrada/i)).toBeInTheDocument();
    expect(screen.getByText(/revisa la url/i)).toBeInTheDocument();
  });
});
