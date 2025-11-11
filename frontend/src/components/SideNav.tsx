import React from "react";
import { NavLink } from "react-router-dom";

const base = "block rounded-xl px-3 py-2 text-sm transition hover:bg-slate-100";

export default function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegación lateral" className="flex flex-col gap-1">
      {[
        { to: "/", label: "Inicio" },
        { to: "/projects", label: "Proyectos" },
        { to: "/tutor", label: "Tutor" },
        { to: "/login", label: "Iniciar sesión" },
        { to: "/register", label: "Crear cuenta" },
      ].map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `${base} ${isActive ? "bg-blue-600 text-white hover:bg-blue-600" : ""}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
