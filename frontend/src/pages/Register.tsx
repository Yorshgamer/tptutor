import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

const ENDPOINT_REGISTER = "/api/users/register";

type Msg = { type: "error" | "success" | ""; text: string };

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    p1: "",
    p2: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>({ type: "", text: "" });
  const navigate = useNavigate();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Validación cliente
    if (form.p1 !== form.p2) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden ⚠️" });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(ENDPOINT_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.p1,
          role: form.role,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      const ok = payload?.ok ?? res.ok;
      if (!ok)
        throw new Error(payload?.error || "Error al registrar usuario");

      const data = payload?.data ?? payload;
      const { token, user } = data || {};

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }

      setMsg({
        type: "success",
        text: "Usuario registrado con éxito 🎉",
      });

      // limpiar form
      setForm({
        name: "",
        email: "",
        p1: "",
        p2: "",
        role: "student",
      });

      // Si hay token → login automático
      if (token) {
        setTimeout(() => {
          navigate("/tutor");
        }, 1500);
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.message || "No se pudo registrar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <Card title="Crear cuenta">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1 text-slate-200"
            >
              Nombre
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={handleChange}
              data-testid="reg-name"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1 text-slate-200"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              data-testid="reg-email"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium mb-1 text-slate-200"
            >
              Rol
            </label>
            <select
              id="role"
              value={form.role}
              onChange={handleChange}
              data-testid="reg-role"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="student">Alumno</option>
              <option value="teacher">Profesor</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="p1"
              className="block text-sm font-medium mb-1 text-slate-200"
            >
              Contraseña
            </label>
            <input
              id="p1"
              type="password"
              required
              minLength={6}
              value={form.p1}
              onChange={handleChange}
              data-testid="reg-pass1"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="p2"
              className="block text-sm font-medium mb-1 text-slate-200"
            >
              Confirmar contraseña
            </label>
            <input
              id="p2"
              type="password"
              required
              minLength={6}
              value={form.p2}
              onChange={handleChange}
              data-testid="reg-pass2"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {msg.text && (
            <p
              data-testid="reg-feedback"
              className={`text-sm font-medium p-2 rounded border ${
                msg.type === "error"
                  ? "bg-red-900/40 text-red-200 border-red-700/70"
                  : "bg-emerald-900/40 text-emerald-200 border-emerald-700/70"
              }`}
            >
              {msg.text}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="reg-submit-btn"
          >
            {loading ? "Registrando..." : "📝 Registrarme"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default Register;
export { Register };