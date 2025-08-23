import React from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Login() {
  return (
    <div className="max-w-md">
      <Card title="Iniciar sesión">
        <form className="space-y-4" onSubmit={(e)=>{e.preventDefault();}}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Correo</label>
            <input id="email" type="email" required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="tu@correo.com" />
          </div>
          <div>
            <label htmlFor="pass" className="block text-sm font-medium mb-1">Contraseña</label>
            <input id="pass" type="password" required minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <Button type="submit" className="w-full">➡️ Entrar</Button>
        </form>
      </Card>
    </div>
  );
}
