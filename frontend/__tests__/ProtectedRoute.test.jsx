// __tests__/ProtectedRoute.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../src/auth/ProtectedRoute";

jest.mock("../src/auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../src/auth/AuthContext");

describe("✅ ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("muestra 'Cargando…' cuando loading=true", () => {
    useAuth.mockReturnValue({
      token: null,
      loading: true,
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/tutor"]}>
        <Routes>
          <Route
            path="/tutor"
            element={<ProtectedRoute />}
          >
            <Route index element={<div>Privado</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  test("si hay token, renderiza el contenido privado y llama a refreshMe", () => {
    const refreshMe = jest.fn();

    useAuth.mockReturnValue({
      token: "abc",
      loading: false,
      refreshMe,
    });

    render(
      <MemoryRouter initialEntries={["/tutor"]}>
        <Routes>
          <Route
            path="/tutor"
            element={<ProtectedRoute />}
          >
            <Route index element={<div>Zona privada</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/zona privada/i)).toBeInTheDocument();
    expect(refreshMe).toHaveBeenCalled();
  });

  test("si NO hay token, navega a /login", () => {
    useAuth.mockReturnValue({
      token: null,
      loading: false,
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/tutor"]}>
        <Routes>
          <Route
            path="/tutor"
            element={<ProtectedRoute />}
          >
            <Route index element={<div>Zona privada</div>} />
          </Route>
          <Route path="/login" element={<div>Pantalla login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/pantalla login/i)).toBeInTheDocument();
  });
});
