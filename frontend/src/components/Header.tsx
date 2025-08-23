import { Link } from "react-router-dom";

type Props = { onToggleSidebar: () => void };

export default function Header({ onToggleSidebar }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-primary to-blue-700 text-white shadow-md">
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

        <div className="hidden md:block text-sm opacity-90">
          {/* espacio para acciones futuras */}
        </div>
      </div>
    </header>
  );
}
