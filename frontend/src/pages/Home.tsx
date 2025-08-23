export default function Home() {
  return (
    <section className="min-h-[50vh] flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Bienvenido 👋</h2>
      <p className="text-slate-600">
        Frontend TP2 listo con Tailwind v4 (solo tema claro).
      </p>
      <div className="flex gap-3">
        <span className="px-3 py-2 rounded-2xl bg-primary text-white">Primario</span>
        <span className="px-3 py-2 rounded-2xl bg-accent text-black">Acento</span>
      </div>
    </section>
  );
}