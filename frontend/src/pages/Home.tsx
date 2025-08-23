import Card from "../components/Card";

export default function Home() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Estado">
        <p className="text-slate-600">
          Frontend TP2 listo con Tailwind v4 (solo tema claro).
        </p>
      </Card>
      <Card title="Colores">
        <div className="flex gap-3">
          <span className="px-3 py-2 rounded-2xl bg-primary text-white">Primario</span>
          <span className="px-3 py-2 rounded-2xl bg-accent text-black">Acento</span>
        </div>
      </Card>
    </section>
  );
}