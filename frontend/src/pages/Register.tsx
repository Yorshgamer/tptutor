import React from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Register() {
  return (
    <div className="max-w-md">
      <Card title="Crear cuenta">
        <form className="space-y-4" onSubmit={(e)=>{e.preventDefault();}}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="name" required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tu nombre" />
          </div>
          <div>
            <label htmlFor="email2" className="block text-sm font-medium mb-1">Correo</label>
            <input id="email2" type="email" required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="tu@correo.com" />
          </div>
          <div>
            <label htmlFor="p1" className="block text-sm font-medium mb-1">Contraseña</label>
            <input id="p1" type="password" required minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div>
            <label htmlFor="p2" className="block text-sm font-medium mb-1">Confirmar contraseña</label>
            <input id="p2" type="password" required minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <Button type="submit" className="w-full" variant="secondary">📝 Registrarme</Button>
        </form>
      </Card>
    </div>
  );
}
