import { NavLink } from "react-router-dom";

const linkBase =
  "block rounded-xl px-3 py-2 text-sm transition hover:bg-slate-100";

type Props = { onNavigate?: () => void };

export default function SideNav({ onNavigate }: Props) {
  return (
    <nav aria-label="Navegación lateral" className="flex flex-col gap-1">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `${linkBase} ${isActive ? "bg-primary text-white hover:bg-primary" : ""}`
        }
        onClick={onNavigate}
      >
        Inicio
      </NavLink>
      <NavLink
        to="/projects"
        className={({ isActive }) =>
          `${linkBase} ${isActive ? "bg-primary text-white hover:bg-primary" : ""}`
        }
        onClick={onNavigate}
      >
        Proyectos
      </NavLink>
      <NavLink
        to="/tutor"
        className={({ isActive }) =>
          `${linkBase} ${isActive ? "bg-primary text-white hover:bg-primary" : ""}`
        }
        onClick={onNavigate}
      >
        Tutor
      </NavLink>
      <div className="h-px my-2 bg-slate-200" />
      <NavLink
        to="/login"
        className={({ isActive }) =>
          `${linkBase} ${isActive ? "bg-primary text-white hover:bg-primary" : ""}`
        }
        onClick={onNavigate}
      >
        Iniciar sesión
      </NavLink>
      <NavLink
        to="/register"
        className={({ isActive }) =>
          `${linkBase} ${isActive ? "bg-primary text-white hover:bg-primary" : ""}`
        }
        onClick={onNavigate}
      >
        Crear cuenta
      </NavLink>
    </nav>
  );
}
