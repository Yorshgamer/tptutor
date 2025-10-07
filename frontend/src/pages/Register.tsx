import React, { useState, ChangeEvent, FormEvent } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    p1: "",
    p2: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success" | ""; text: string }>({
    type: "",
    text: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (form.p1 !== form.p2) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden ⚠️" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.p1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar usuario");

      setMsg({ type: "success", text: data.message });
      setForm({ name: "", email: "", p1: "", p2: "" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <Card title="Crear cuenta">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="p1" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              id="p1"
              type="password"
              required
              minLength={6}
              value={form.p1}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="p2" className="block text-sm font-medium mb-1">
              Confirmar contraseña
            </label>
            <input
              id="p2"
              type="password"
              required
              minLength={6}
              value={form.p2}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {msg.text && (
            <p
              className={`text-sm font-medium p-2 rounded ${
                msg.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {msg.text}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "📝 Registrarme"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
