import React, { useState, ChangeEvent, FormEvent } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Login() {
  const [form, setForm] = useState({ email: "", pass: "" });
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

    try {
      setLoading(true);
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.pass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      localStorage.setItem("user", JSON.stringify(data.user));
      setMsg({ type: "success", text: "Inicio de sesión exitoso 🚀" });

      // Redirección opcional:
      // window.location.href = "/tutor";
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <Card title="Iniciar sesión">
        <form className="space-y-4" onSubmit={handleSubmit}>
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
            <label htmlFor="pass" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              id="pass"
              type="password"
              required
              minLength={6}
              value={form.pass}
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
            {loading ? "Ingresando..." : "➡️ Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
