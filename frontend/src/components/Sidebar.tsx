import SideNav from "./SideNav";

type Props = { open: boolean; onClose: () => void };

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel móvil (off-canvas). Oculto en md+ */}
      <aside
        aria-label="Menú lateral"
        className={`fixed z-40 left-0 top-14 h-[calc(100vh-56px)] w-72 bg-white border-r shadow-lg transform transition-transform md:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-3">
          <SideNav onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
