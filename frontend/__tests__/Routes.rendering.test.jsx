// __tests__/Routes.rendering.test.jsx
import { render, screen, act, cleanup } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { router } from "../src/routes/Router";

// -------------------------------------------------------------
// 🧪 MOCK DE AuthContext → evita el error “useAuth must be used within AuthProvider”
// -------------------------------------------------------------
jest.mock("../src/auth/AuthContext", () => {
  const React = require("react");

  const mockAuthValue = {
    user: { id: 1, email: "test@example.com", name: "Test User" },
    token: "fake-token",
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshMe: jest.fn(),
  };

  const AuthContext = React.createContext(mockAuthValue);

  function AuthProvider({ children }) {
    return (
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  function useAuth() {
    return React.useContext(AuthContext);
  }

  return {
    __esModule: true,
    AuthProvider,
    useAuth,
  };
});

// -------------------------------------------------------------
// Mock Layout para evitar errores de estructura
// -------------------------------------------------------------
jest.mock("../src/components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="layout-wrapper">
      <header>MockLayout</header>
      <main>{children}</main>
    </div>
  ),
}));

// -------------------------------------------------------------
// Mock de páginas para pruebas de rutas
// -------------------------------------------------------------
jest.mock("../src/pages/Home",     () => ({ __esModule: true, default: () => <h1>HomePage</h1> }));
jest.mock("../src/pages/Projects", () => ({ __esModule: true, default: () => <h1>ProjectsPage</h1> }));
jest.mock("../src/pages/Tutor",    () => ({ __esModule: true, default: () => <h1>TutorPage</h1> }));
jest.mock("../src/pages/Login",    () => ({ __esModule: true, default: () => <h1>LoginPage</h1> }));
jest.mock("../src/pages/Register", () => ({ __esModule: true, default: () => <h1>RegisterPage</h1> }));

afterEach(() => cleanup());

// -------------------------------------------------------------
// 🚀 TESTS DE RUTEO PRINCIPAL
// -------------------------------------------------------------
describe.skip("✅ Router principal", () => {
  test("Renderiza Home en '/'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => await router.navigate("/"));
    expect(screen.getByTestId("layout-wrapper")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HomePage" })).toBeInTheDocument();
  });

  test("Renderiza Login en '/login'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => await router.navigate("/login"));
    expect(screen.getByTestId("layout-wrapper")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "LoginPage" })).toBeInTheDocument();
  });

  test("Renderiza Projects en '/projects'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => await router.navigate("/projects"));
    expect(screen.getByRole("heading", { name: "ProjectsPage" })).toBeInTheDocument();
  });

  test("Renderiza Tutor en '/tutor'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => await router.navigate("/tutor"));
    expect(screen.getByRole("heading", { name: "TutorPage" })).toBeInTheDocument();
  });

  test("Renderiza Register en '/register'", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => await router.navigate("/register"));
    expect(screen.getByRole("heading", { name: "RegisterPage" })).toBeInTheDocument();
  });

  test("Renderiza página 404 para rutas desconocidas", async () => {
    render(<RouterProvider router={router} />);
    await act(async () => await router.navigate("/no-existe"));

    // Ajusta estos textos según tu NotFound real
    expect(screen.getByText(/página no encontrada/i)).toBeInTheDocument();
    expect(screen.getByText(/revisa la url/i)).toBeInTheDocument();
  });
});
