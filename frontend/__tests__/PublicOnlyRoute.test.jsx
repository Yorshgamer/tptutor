// __tests__/PublicOnlyRoute.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PublicOnlyRoute from "../src/auth/PublicOnlyRoute";

jest.mock("../src/auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../src/auth/AuthContext");

describe("✅ PublicOnlyRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("muestra 'Cargando…' cuando loading=true", () => {
    useAuth.mockReturnValue({
      token: null,
      loading: true,
    });

    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <div>Contenido público</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  test("si NO hay token, muestra los children", () => {
    useAuth.mockReturnValue({
      token: null,
      loading: false,
    });

    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <div>Zona pública</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/zona pública/i)).toBeInTheDocument();
  });

  test("si HAY token, redirige a /tutor", () => {
    useAuth.mockReturnValue({
      token: "abc",
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <div>Zona pública</div>
              </PublicOnlyRoute>
            }
          />
          <Route path="/tutor" element={<div>Pantalla tutor</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/pantalla tutor/i)).toBeInTheDocument();
  });
});
