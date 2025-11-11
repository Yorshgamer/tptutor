import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Tag from "../components/Tag";
import Button from "../components/Button";

/**
 * Projects.tsx — vista con CRUD básico usando una API mock (localStorage).
 *
 * Cuando tengas backend, reemplaza las funciones de `api` por tus llamadas reales
 * (fetch/axios) y elimina el flag USE_MOCK. Mantuvimos las firmas para que no cambie tu UI.
 */

// -----------------------------
// Tipos y utilidades
// -----------------------------

type ProjectStatus = "pending" | "in_progress" | "done";

type Project = {
  id: string; // UUID
  name: string;
  description?: string;
  status: ProjectStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  done: "Completado",
};

const STATUS_CHIP: Record<ProjectStatus, string> = {
  pending: "inline-flex rounded-lg bg-yellow-100 px-2.5 py-1 text-yellow-800",
  in_progress: "inline-flex rounded-lg bg-blue-100 px-2.5 py-1 text-blue-800",
  done: "inline-flex rounded-lg bg-green-100 px-2.5 py-1 text-green-800",
};

const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

// -----------------------------
// API mock (localStorage)
// -----------------------------

const LS_KEY = "tptutor.projects";
const USE_MOCK = true; // cambia a false cuando conectes backend real

function readLS(): Project[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLS(items: Project[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

const api = {
  async list(params?: { q?: string; status?: "all" | ProjectStatus }) {
    let items = readLS();
    if (params?.q) {
      const q = params.q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.status && params.status !== "all") {
      items = items.filter((p) => p.status === params.status);
    }
    // Simula latencia ligera
    await new Promise((r) => setTimeout(r, 150));
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async create(input: Omit<Project, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const item: Project = { ...input, id: uid(), createdAt: now, updatedAt: now };
    const items = readLS();
    items.push(item);
    writeLS(items);
    await new Promise((r) => setTimeout(r, 120));
    return item;
  },
  async update(id: string, patch: Partial<Omit<Project, "id" | "createdAt">>) {
    const items = readLS();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("NOT_FOUND");
    const updated = {
      ...items[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    } as Project;
    items[idx] = updated;
    writeLS(items);
    await new Promise((r) => setTimeout(r, 120));
    return updated;
  },
  async remove(id: string) {
    const items = readLS();
    const next = items.filter((p) => p.id !== id);
    writeLS(next);
    await new Promise((r) => setTimeout(r, 120));
    return { ok: true } as const;
  },
  async get(id: string) {
    const items = readLS();
    const found = items.find((p) => p.id === id);
    await new Promise((r) => setTimeout(r, 100));
    if (!found) throw new Error("NOT_FOUND");
    return found;
  },
};

// -----------------------------
// Componentes auxiliares
// -----------------------------

type FormState = {
  name: string;
  description: string;
  status: ProjectStatus;
  tags: string; // CSV en UI; internamente convertimos a string[]
};

const emptyForm: FormState = {
  name: "",
  description: "",
  status: "in_progress",
  tags: "",
};

function toTags(csv: string): string[] {
  return csv
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function fromTags(arr: string[]): string {
  return arr?.join(", ") ?? "";
}

function StatusSelect({ value, onChange }: { value: ProjectStatus; onChange: (v: ProjectStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectStatus)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
    >
      <option value="in_progress">En curso</option>
      <option value="pending">Pendiente</option>
      <option value="done">Completado</option>
    </select>
  );
}

function StatusChip({ status }: { status: ProjectStatus }) {
  return <span className={STATUS_CHIP[status]}>{STATUS_LABEL[status]}</span>;
}

function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// -----------------------------
// Página principal — Projects
// -----------------------------

export default function Projects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<{ open: boolean; id?: string }>({ open: false });
  const [showView, setShowView] = useState<{ open: boolean; id?: string }>({ open: false });

  const filteredCount = items.length;

  // Cargar al inicio o cuando cambie filtro
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .list({ q, status })
      .then((data) => {
        if (alive) setItems(data);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, status]);

  // Handlers CRUD
  async function handleCreate(form: FormState) {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      tags: toTags(form.tags),
    } as Omit<Project, "id" | "createdAt" | "updatedAt">;
    const created = await api.create(payload);
    setItems((prev) => [created, ...prev]);
  }

  async function handleUpdate(id: string, form: FormState) {
    const patch = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      tags: toTags(form.tags),
    } as Partial<Project>;
    const updated = await api.update(id, patch);
    setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await api.remove(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div className="space-y-6">
      <Card title="Proyectos" subtitle="Filtra y crea proyectos">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            <input
              className="pl-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="in_progress">En curso</option>
            <option value="done">Completado</option>
            <option value="pending">Pendiente</option>
          </select>

          <div className="ml-auto">
            <Button variant="secondary" onClick={() => setShowCreate(true)}>➕ Nuevo proyecto</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between pb-2 text-sm text-slate-500">
          <span>{loading ? "Cargando…" : `${filteredCount} proyecto(s)`}</span>
          {USE_MOCK && <span className="rounded-lg bg-slate-100 px-2 py-1">mock/localStorage</span>}
        </div>
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
              {items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-3 pr-4 font-medium">
                    <div className="font-semibold">{p.name}</div>
                    {p.description && <div className="text-xs text-slate-500 line-clamp-2">{p.description}</div>}
                  </td>
                  <td className="py-3 pr-4"><StatusChip status={p.status} /></td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {p.tags?.map((t, i) => (
                        <Tag key={i}>{t}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setShowView({ open: true, id: p.id })}>Ver</Button>
                      <Button variant="subtle" onClick={() => setShowEdit({ open: true, id: p.id })}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(p.id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal crear */}
      <CreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (data) => {
          await handleCreate(data);
          setShowCreate(false);
        }}
      />

      {/* Modal ver */}
      <ViewModal
        ctx={showView}
        onClose={() => setShowView({ open: false })}
      />

      {/* Modal editar */}
      <EditModal
        ctx={showEdit}
        onClose={() => setShowEdit({ open: false })}
        onSubmit={async (id, data) => {
          await handleUpdate(id, data);
          setShowEdit({ open: false });
        }}
      />
    </div>
  );
}

// -----------------------------
// Modales
// -----------------------------

function CreateModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: FormState) => Promise<void> }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const canSubmit = form.name.trim().length >= 3;

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proyecto">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej. Clasificador de Imágenes"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Estado</label>
            <StatusSelect value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
          </div>
          <div className="grow">
            <label className="mb-1 block text-sm font-medium">Tags (separados por coma)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
              placeholder="IA, Equipo, Docs"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button
            onClick={async () => {
              if (!canSubmit) return;
              setBusy(true);
              try { await onSubmit(form); } finally { setBusy(false); }
            }}
            disabled={!canSubmit || busy}
          >{busy ? "Guardando…" : "Guardar"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ViewModal({ ctx, onClose }: { ctx: { open: boolean; id?: string }; onClose: () => void }) {
  const [item, setItem] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!ctx.open || !ctx.id) return;
    setLoading(true);
    api.get(ctx.id)
      .then((p) => alive && setItem(p))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [ctx.open, ctx.id]);

  return (
    <Modal open={ctx.open} onClose={onClose} title="Detalle de proyecto">
      {loading && <p className="text-sm text-slate-500">Cargando…</p>}
      {!loading && item && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold">{item.name}</h4>
            <StatusChip status={item.status} />
          </div>
          {item.description && <p className="text-slate-700">{item.description}</p>}
          <div className="flex flex-wrap gap-2">
            {item.tags.map((t, i) => (
              <Tag key={i}>{t}</Tag>
            ))}
          </div>
          <div className="text-xs text-slate-400">
            <div>Creado: {new Date(item.createdAt).toLocaleString()}</div>
            <div>Actualizado: {new Date(item.updatedAt).toLocaleString()}</div>
          </div>
          <div className="pt-2 text-right">
            <Button variant="subtle" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function EditModal({ ctx, onClose, onSubmit }: { ctx: { open: boolean; id?: string }; onClose: () => void; onSubmit: (id: string, data: FormState) => Promise<void> }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!ctx.open || !ctx.id) return;
    setLoading(true);
    api
      .get(ctx.id)
      .then((p) => {
        if (!alive) return;
        setForm({
          name: p.name,
          description: p.description ?? "",
          status: p.status,
          tags: fromTags(p.tags),
        });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [ctx.open, ctx.id]);

  const canSubmit = form.name.trim().length >= 3;

  return (
    <Modal open={!!ctx.open} onClose={onClose} title="Editar proyecto">
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <StatusSelect value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
            </div>
            <div className="grow">
              <label className="mb-1 block text-sm font-medium">Tags (separados por coma)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!canSubmit || !ctx.id) return;
                setBusy(true);
                try { await onSubmit(ctx.id, form); } finally { setBusy(false); }
              }}
              disabled={!canSubmit || busy}
            >{busy ? "Guardando…" : "Guardar"}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}