// src/components/Sidebar.tsx
import React from "react";
import SideNav from "./SideNav";

function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-30 backdrop-blur-sm bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
          role="button"
          tabIndex={0}
        />
      )}

      {/* Sidebar móvil */}
      <aside
        aria-label="Menú lateral"
        className={`fixed z-40 left-0 top-14 h-[calc(100vh-56px)] w-72 
          bg-neutral-900 border-r border-slate-800 shadow-lg md:hidden
          transform ${open ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-out`}
      >
        <div className="p-2">
          <SideNav onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
export { Sidebar };
