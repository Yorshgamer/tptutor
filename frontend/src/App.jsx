export default function App() {
  const dark = document.documentElement.classList.contains('dark');
  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-6">
        <h1 className="text-xl font-semibold">TP2 — Frontend</h1>
        <button
          onClick={() => {
            const v = !document.documentElement.classList.contains('dark');
            document.documentElement.classList.toggle('dark', v);
            localStorage.setItem('theme-mode', v ? 'dark' : 'light');
          }}
          className="rounded-2xl px-4 py-2 bg-primary text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          {dark ? '🌙 Oscuro' : '☀️ Claro'}
        </button>
      </header>

      <main className="space-y-4">
        <div className="flex gap-3">
          <span className="px-3 py-2 rounded-2xl bg-primary text-white">Primario</span>
          <span className="px-3 py-2 rounded-2xl bg-accent text-black">Acento</span>
          <span className="px-3 py-2 rounded-2xl bg-slate-200 text-black">Claro</span>
          <span className="px-3 py-2 rounded-2xl bg-slate-800 text-white">Oscuro</span>
        </div>
      </main>
    </div>
  );
}
