import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SideNav from "./SideNav";

function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Header superior */}
      <Header onToggleSidebar={() => setOpen(true)} />

      {/* Contenido principal */}
      <div className="mx-auto max-w-6xl px-4 mt-6 md:mt-8">
        <div className="md:grid md:grid-cols-12 md:gap-6">
          {/* Sidebar fijo en desktop */}
          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-neutral-900 border border-slate-800 shadow-sm p-2">
                <SideNav />
              </div>
            </div>
          </aside>

          {/* 👇 Aquí se renderizan las rutas hijas */}
          <main className="md:col-span-9 py-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Sidebar móvil (overlay) */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-neutral-900 mt-10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-400">
          © 2025 — Taller de Proyecto 2 · Frontend
        </div>
      </footer>
    </div>
  );
}

export default Layout;
export { Layout };
