import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Router";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header moderno */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-primary to-blue-700 text-white shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold tracking-wide">TP2 — Tutor de lectura crítica</h1>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
            <a href="/" className="hover:text-white">Inicio</a>
            <a href="/projects" className="hover:text-white">Proyectos</a>
            <a href="/tutor" className="hover:text-white">Tutor</a>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <RouterProvider router={router} />
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          © 2025 — Taller de Proyecto 2
        </div>
      </footer>
    </div>
  );
}
