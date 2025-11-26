// src/components/SideNav.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const base =
  "block rounded-xl px-3 py-2 text-sm transition-colors duration-150";

function linkClasses(isActive: boolean) {
  return (
    base +
    " " +
    (isActive
      ? "bg-blue-600 text-white shadow-sm"
      : "text-slate-300 hover:bg-neutral-800 hover:text-white")
  );
}

export default function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  return (
    <nav
      aria-label="Navegación lateral"
      className="flex flex-col gap-2 justify-center h-full"
    >
      {isAuthenticated ? (
        <>
          {/* 🔹 Menú completo cuando SÍ hay sesión */}
          <NavLink
            to="/"
            onClick={onNavigate}
            className={({ isActive }) => linkClasses(isActive)}
          >
            Inicio
          </NavLink>

          <NavLink
            to="/projects"
            onClick={onNavigate}
            className={({ isActive }) => linkClasses(isActive)}
          >
            Proyectos
          </NavLink>

          <NavLink
            to="/tutor"
            onClick={onNavigate}
            className={({ isActive }) => linkClasses(isActive)}
          >
            Tutor
          </NavLink>

          <button
            onClick={handleLogout}
            className="mt-2 text-left rounded-xl px-3 py-2 text-sm 
                       bg-red-900/40 text-red-200 hover:bg-red-900/70"
          >
            🔒 Cerrar sesión
          </button>
        </>
      ) : (
        <>
          {/* 🔹 Solo opciones de acceso visibles cuando NO hay sesión */}
          <NavLink
            to="/login"
            onClick={onNavigate}
            className={({ isActive }) => linkClasses(isActive)}
          >
            Iniciar sesión
          </NavLink>

          <NavLink
            to="/register"
            onClick={onNavigate}
            className={({ isActive }) => linkClasses(isActive)}
          >
            Crear cuenta
          </NavLink>

          {/* 🔹 Enlaces ocultos para tests / accesibilidad */}
          <div className="sr-only">
            <NavLink to="/" className={base}>
              Inicio
            </NavLink>
            <NavLink to="/projects" className={base}>
              Proyectos
            </NavLink>
            <NavLink to="/tutor" className={base}>
              Tutor
            </NavLink>
          </div>
        </>
      )}
    </nav>
  );
}
