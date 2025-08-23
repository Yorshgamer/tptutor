import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Router";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold tracking-wide">TP2 — Tutor de lectura crítica</h1>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/" className="hover:text-primary">Inicio</a>
            <a href="/projects" className="hover:text-primary">Proyectos</a>
            <a href="/tutor" className="hover:text-primary">Tutor</a>
          </nav>
        </div>
      </header>

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
