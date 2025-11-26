// src/components/Header.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 to-black text-white shadow-lg">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">

        {/* Botón menú móvil */}
        <button
          aria-label="Abrir menú"
          onClick={onToggleSidebar}
          className="md:hidden rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          ☰
        </button>

        {/* Logo / Nombre del sistema */}
        <Link to="/" className="font-semibold tracking-wide select-none">
          TP2 — Tutor de lectura crítica
        </Link>

        {/* Sección derecha */}
        <div className="hidden md:flex items-center gap-3 text-sm text-slate-200">
          {isAuthenticated ? (
            <>
              <span className="truncate max-w-[200px]">
                Hola, <strong className="text-white">{user?.name}</strong>
              </span>

              <button
                onClick={handleLogout}
                className="ml-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
                title="Cerrar sesión"
              >
                🔒 Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                Iniciar sesión
              </Link>

              <Link
                to="/register"
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
export { Header };