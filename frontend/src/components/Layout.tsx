import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SideNav from "./SideNav";

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onToggleSidebar={() => setOpen(true)} />

      <div className="mx-auto max-w-6xl px-4 mt-6 md:mt-8">
        <div className="md:grid md:grid-cols-12 md:gap-6">
          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-white border shadow-sm p-3">
                <SideNav />
              </div>
            </div>
          </aside>

          {/* 👇 Aquí va el contenido de las rutas hijas */}
          <main className="md:col-span-9 py-6">
            <Outlet />
          </main>
        </div>
      </div>

      <Sidebar open={open} onClose={() => setOpen(false)} />

      <footer className="border-t bg-white mt-10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          © 2025 — Taller de Proyecto 2 · Frontend
        </div>
      </footer>
    </div>
  );
}
