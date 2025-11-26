// __tests__/AuthContext.unit.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";

function ShowAuthState() {
  const { user, token, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <span data-testid="auth-name">{user?.name}</span>
      <span data-testid="auth-token">{token}</span>
      <span data-testid="auth-flag">{isAuthenticated ? "yes" : "no"}</span>
    </div>
  );
}

describe("AuthContext - carga inicial desde localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("lee token y usuario de localStorage al montar", async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "1",
        name: "Usuario LocalStorage",
        email: "test@example.com",
        role: "student",
      })
    );

    render(
      <AuthProvider>
        <ShowAuthState />
      </AuthProvider>
    );

    // Esperamos a que deje de estar en loading y pinte los datos
    const nameEl = await screen.findByTestId("auth-name");

    expect(nameEl).toHaveTextContent("Usuario LocalStorage");
    expect(screen.getByTestId("auth-token")).toHaveTextContent("test-token");
    expect(screen.getByTestId("auth-flag")).toHaveTextContent("yes");
  });
});
