// src/components/Header.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <button
          aria-label="Abrir menú"
          onClick={onToggleSidebar}
          className="md:hidden rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          ☰
        </button>

        <Link to="/" className="font-semibold tracking-wide">
          TP2 — Tutor de lectura crítica
        </Link>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3 text-sm opacity-90">
          {isAuthenticated ? (
            <>
              <span className="truncate max-w-[180px]">
                Hola, <strong>{user?.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
                title="Cerrar sesión"
              >
                🔒 Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">
                Iniciar sesión
              </Link>
              <Link to="/register" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
