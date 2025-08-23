import React from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Tutor() {
  return (
    <div className="space-y-6">
      <Card title="Tutor de Lectura Crítica" subtitle="Carga un texto y evalúa">
        <label className="block text-sm font-medium text-slate-700 mb-2">Texto a analizar</label>
        <textarea rows={6}
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Pega aquí un texto para generar preguntas y evaluar comprensión…"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button>📄 Generar preguntas</Button>
          <Button variant="secondary">✅ Evaluar</Button>
        </div>
      </Card>
    </div>
  );
}
