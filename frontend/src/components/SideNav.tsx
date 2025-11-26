// src/components/SideNav.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const base = "block rounded-xl px-3 py-2 text-sm transition hover:bg-slate-100";

export default function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  return (
    <nav aria-label="Navegación lateral" className="flex flex-col gap-1">
      {/* visibles solo con sesión */}
      {isAuthenticated && (
        <>
          <NavLink
            to="/"
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/projects"
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`}
          >
            Proyectos
          </NavLink>
          <NavLink
            to="/tutor"
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`}
          >
            Tutor
          </NavLink>

          <button
            onClick={handleLogout}
            className="mt-2 text-left rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100"
          >
            🔒 Cerrar sesión
          </button>
        </>
      )}

      {/* visibles solo SIN sesión */}
      {!isAuthenticated && (
        <>
          <NavLink
            to="/login"
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`}
          >
            Iniciar sesión
          </NavLink>
          <NavLink
            to="/register"
            onClick={onNavigate}
            className={({ isActive }) => `${base} ${isActive ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`}
          >
            Crear cuenta
          </NavLink>
        </>
      )}
    </nav>
  );
}
