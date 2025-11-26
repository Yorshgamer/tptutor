import React from "react";
import Card from "../components/Card";
import Tag from "../components/Tag";

export default function Home() {
  return (
    <div className="space-y-6" data-testid="home-container">
      <Card className="overflow-hidden">
        <div className="relative isolate -m-5 p-8 md:p-10">
          
          {/* Fondo con gradiente */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-900 via-black to-black"
            data-testid="home-gradient-bg"
          />

          <div className="relative">
            <h2
              className="text-2xl font-bold text-white"
              data-testid="home-title"
            >
              Bienvenido 👋
            </h2>

            <p
              className="mt-2 max-w-2xl text-slate-300"
              data-testid="home-description"
            >
              Frontend TP2 — tema oscuro, header con gradiente, sidebar
              responsive, tarjetas y formularios base.
            </p>

            <div
              className="mt-5 flex flex-wrap items-center gap-2"
              data-testid="home-tags"
            >
              <Tag>Responsive</Tag>
              <Tag>Accesible</Tag>
              <Tag>Moderno</Tag>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
