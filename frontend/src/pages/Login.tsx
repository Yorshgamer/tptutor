import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";

const ENDPOINT_LOGIN = "/api/auth/login";
type Msg = { type: "error" | "success" | ""; text: string };

function Login() {
  const [form, setForm] = useState({ email: "", pass: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>({ type: "", text: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    try {
      setLoading(true);
      const res = await fetch(ENDPOINT_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.pass }),
      });

      const payload = await res.json().catch(() => ({}));
      const ok = payload?.ok ?? res.ok;
      if (!ok) throw new Error(payload?.error || "Error al iniciar sesión");

      const data = payload?.data ?? payload;
      const { token, user } = data || {};

      login(token, user);
      setMsg({ type: "success", text: "Inicio de sesión exitoso 🚀" });

      // Esperamos un poco para que se vea el mensaje y Cypress lo detecte
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || "/tutor";
        navigate(from, { replace: true });
      }, 1500);
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.message || "No se pudo iniciar sesión",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <Card title="Iniciar sesión">
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              data-testid="login-email"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="pass"
              className="block text-sm font-medium mb-1 text-slate-200"
            >
              Contraseña
            </label>
            <input
              id="pass"
              type="password"
              required
              minLength={6}
              value={form.pass}
              onChange={handleChange}
              data-testid="login-pass"
              className="w-full rounded-xl border border-slate-800 bg-neutral-900 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {msg.text && (
            <p
              data-testid="login-feedback"
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
            data-testid="login-submit-btn"
          >
            {loading ? "Ingresando..." : "➡️ Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default Login;
export { Login };