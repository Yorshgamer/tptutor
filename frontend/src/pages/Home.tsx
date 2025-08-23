import React from "react";
import Card from "../components/Card";
import Tag from "../components/Tag";

export default function Home() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative isolate -m-5 p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200" />
          <div className="relative">
            <h2 className="text-2xl font-bold">Bienvenido 👋</h2>
            <p className="mt-2 max-w-2xl text-slate-700">
              Frontend TP2 — tema claro, header con gradiente, sidebar responsive, tarjetas y formularios base.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Tag>Responsive</Tag><Tag>Accesible</Tag><Tag>Moderno</Tag>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
