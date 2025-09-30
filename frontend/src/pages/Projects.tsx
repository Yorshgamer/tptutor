import React from "react";
import Card from "../components/Card";
import Tag from "../components/Tag";
import Button from "../components/Button";

export default function Projects() {
  return (
    <div className="space-y-6">
      <Card title="Proyectos" subtitle="Filtra y crea proyectos">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            <input
              className="pl-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Buscar…"
            />
          </div>
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
            <option>Todos</option><option>En curso</option><option>Completado</option><option>Pendiente</option>
          </select>
          <div className="ml-auto">
            <Button variant="secondary">➕ Nuevo proyecto</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Proyecto</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Tags</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-800">
              {[1,2,3].map(i => (
                <tr key={i} className="border-t">
                  <td className="py-3 pr-4 font-medium">Proyecto {i}</td>
                  <td className="py-3 pr-4">
                    {i % 3 === 0 ? (
                      <span className="inline-flex rounded-lg bg-green-100 px-2.5 py-1 text-green-800">Completado</span>
                    ) : i % 2 === 0 ? (
                      <span className="inline-flex rounded-lg bg-yellow-100 px-2.5 py-1 text-yellow-800">Pendiente</span>
                    ) : (
                      <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 text-blue-800">En curso</span>
                    )}
                  </td>
                  <td className="py-3 pr-4"><div className="flex flex-wrap gap-2"><Tag>IA</Tag><Tag>Equipo</Tag><Tag>Docs</Tag></div></td>
                  <td className="py-3"><div className="flex gap-2"><Button variant="ghost">Ver</Button><Button variant="subtle">Editar</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
