import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import SideNav from "./SideNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onToggleSidebar={() => setOpen(true)} />

      <div className="mx-auto max-w-6xl px-4 mt-6 md:mt-8">
        {/* Grid robusta en v4 */}
        <div className="md:grid md:grid-cols-12 md:gap-6">
          {/* Sidebar inline SOLO desktop */}
          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-20">
              <div className="rounded-2xl bg-white border shadow-sm p-3">
                <SideNav />
              </div>
            </div>
          </aside>

          {/* Contenido */}
          <main className="md:col-span-9 py-6">
            {children}
          </main>
        </div>
      </div>

      {/* Sidebar móvil (overlay) */}
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
