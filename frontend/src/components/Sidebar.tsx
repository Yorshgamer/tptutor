import React from "react";
import SideNav from "./SideNav";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        aria-label="Menú lateral"
        className={`fixed z-40 left-0 top-14 h-[calc(100vh-56px)] w-72 bg-white border-r shadow-lg md:hidden
          ${open ? "translate-x-0" : "-translate-x-full"} transition-transform`}
      >
        <div className="p-2">
          <SideNav onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
