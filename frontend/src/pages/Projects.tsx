import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Tag from "../components/Tag";
import Button from "../components/Button";

/**
 * Projects.tsx — Vista dual por rol
 *
 * - STUDENT: CRUD + progreso propio por proyecto (mock localStorage)
 * - TEACHER/ADMIN: Sustituye pestaña por un roster de estudiantes y estados de sus proyectos
 *
 * Persistencia en localStorage (API mock). Cuando conectes backend, reemplaza `api`, `apiProgress`
 * y `apiUsers` por tus endpoints reales, manteniendo las firmas.
 */

// -----------------------------
// Tipos y utilidades
// -----------------------------

type ProjectStatus = "pending" | "in_progress" | "done";

type Project = {
  id: string; // UUID
  ownerId: string; // propietario
  name: string;
  description?: string;
  status: ProjectStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type User = { id: string; name: string; email: string; role: "student" | "teacher" | "admin" };

type ProgressEntry = {
  projectId: string;
  userId: string;
  percent: number; // 0-100
  note?: string;
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

const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));

function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// -----------------------------
// API mock (localStorage)
// -----------------------------
const LS_PROGRESS = "tptutor.progress"; // array<ProgressEntry>
const USE_MOCK = false;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

type TeacherStudent = {
  id: string;
  name: string;
  email: string;
  assigned: boolean;
};

const apiTeacher = {
  async listStudents(q?: string): Promise<TeacherStudent[]> {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/teacher/students${params.toString() ? "?" + params.toString() : ""}`, {
      headers: getAuthHeaders(), // puedes mover getAuthHeaders arriba a scope global
    });
    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) throw new Error(payload?.error || "Error al cargar estudiantes");
    return payload.data as TeacherStudent[];
  },

  async assignStudent(studentId: string) {
    const res = await fetch(`/api/teacher/students/${studentId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) throw new Error(payload?.error || "Error al asignar estudiante");
  },

  async unassignStudent(studentId: string) {
    const res = await fetch(`/api/teacher/students/${studentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) throw new Error(payload?.error || "Error al quitar estudiante");
  },
};


const API_PROJECTS = "/api/projects";

type BackendProject = {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

function mapProject(p: BackendProject): Project {
  return {
    id: p._id,
    ownerId: p.ownerId,
    name: p.name,
    description: p.description ?? "",
    status: p.status,
    tags: p.tags ?? [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

const api = {
  async list(params?: { q?: string; status?: "all" | ProjectStatus; ownerId?: string }) {
    const me = getCurrentUser();
    if (!me) throw new Error("NO_USER");

    const search = new URLSearchParams();

    if (params?.q) search.set("q", params.q);
    if (params?.status && params.status !== "all") {
      search.set("status", params.status);
    }

    // 🚨 caso especial: Teacher/Admin pidiendo proyectos de OTRO alumno
    if (params?.ownerId && params.ownerId !== me.id) {
      search.set("all", "1"); // backend: si role=teacher/admin y all=1, trae todos
    }

    const url = `${API_PROJECTS}${search.toString() ? "?" + search.toString() : ""}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;

    if (!ok) {
      throw new Error(payload?.error || "Error al obtener proyectos");
    }

    let items: Project[] = (payload.data as BackendProject[]).map(mapProject);

    // si teacher/admin pidió ownerId específico, filtramos aquí
    if (params?.ownerId && params.ownerId !== me.id) {
      items = items.filter((p) => p.ownerId === params.ownerId);
    }

    return items;
  },

  async create(input: Omit<Project, "id" | "createdAt" | "updatedAt" | "ownerId">) {
    const res = await fetch(API_PROJECTS, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: input.name,
        description: input.description ?? "",
        status: input.status,
        tags: input.tags,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) {
      throw new Error(payload?.error || "Error al crear proyecto");
    }

    return mapProject(payload.data as BackendProject);
  },

  async update(id: string, patch: Partial<Omit<Project, "id" | "createdAt" | "ownerId">>) {
    const res = await fetch(`${API_PROJECTS}/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(patch),
    });

    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) {
      throw new Error(payload?.error || "Error al actualizar proyecto");
    }

    return mapProject(payload.data as BackendProject);
  },

  async remove(id: string) {
    const res = await fetch(`${API_PROJECTS}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) {
      throw new Error(payload?.error || "Error al eliminar proyecto");
    }

    return { ok: true } as const;
  },

  async get(id: string, _ownerId?: string) {
    const res = await fetch(`${API_PROJECTS}/${id}`, {
      headers: getAuthHeaders(),
    });

    const payload = await res.json().catch(() => ({}));
    const ok = payload?.ok ?? res.ok;
    if (!ok) {
      throw new Error(payload?.error || "Error al obtener proyecto");
    }

    return mapProject(payload.data as BackendProject);
  },
};

const apiProgress = {
  async upsertMine(projectId: string, payload: { percent: number; note?: string }) {
    const user = getCurrentUser();
    if (!user) throw new Error("NO_USER");
    const all = readJSON<ProgressEntry[]>(LS_PROGRESS, []);
    const idx = all.findIndex((x) => x.projectId === projectId && x.userId === user.id);
    const entry: ProgressEntry = {
      projectId,
      userId: user.id,
      percent: Math.max(0, Math.min(100, Math.round(payload.percent))),
      note: payload.note?.trim() || "",
      updatedAt: new Date().toISOString(),
    };
    if (idx === -1) all.push(entry); else all[idx] = entry;
    writeJSON(LS_PROGRESS, all);
    await new Promise((r) => setTimeout(r, 60));
    return entry;
  },
  async getMine(projectId: string) {
    const user = getCurrentUser();
    if (!user) throw new Error("NO_USER");
    const all = readJSON<ProgressEntry[]>(LS_PROGRESS, []);
    await new Promise((r) => setTimeout(r, 40));
    return all.find((x) => x.projectId === projectId && x.userId === user.id) || null;
  },
  async listByProject(projectId: string) {
    const all = readJSON<ProgressEntry[]>(LS_PROGRESS, []);
    await new Promise((r) => setTimeout(r, 40));
    return all.filter((x) => x.projectId === projectId);
  },
  async listByUser(userId: string) {
    const all = readJSON<ProgressEntry[]>(LS_PROGRESS, []);
    await new Promise((r) => setTimeout(r, 40));
    return all.filter((x) => x.userId === userId);
  },
};

// -----------------------------
// Componentes auxiliares
// -----------------------------

type FormState = { name: string; description: string; status: ProjectStatus; tags: string };

const emptyForm: FormState = { name: "", description: "", status: "in_progress", tags: "" };

function toTags(csv: string): string[] { return csv.split(",").map((t) => t.trim()).filter(Boolean); }
function fromTags(arr: string[]): string { return arr?.join(", ") ?? ""; }

function StatusSelect({ value, onChange }: { value: ProjectStatus; onChange: (v: ProjectStatus) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as ProjectStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
      <option value="in_progress">En curso</option>
      <option value="pending">Pendiente</option>
      <option value="done">Completado</option>
    </select>
  );
}

function StatusChip({ status }: { status: ProjectStatus }) {
  return <span className={STATUS_CHIP[status]}>{STATUS_LABEL[status]}</span>;
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-40 rounded-xl border border-slate-200">
      <div className="h-2 rounded-xl bg-blue-600" style={{ width: `${v}%` }} />
    </div>
  );
}

function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
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
// Página principal — Render por rol
// -----------------------------

export default function Projects() {
  const me = getCurrentUser();
  const isTeacher = me?.role === "teacher" || me?.role === "admin";

  return isTeacher ? <TeacherView /> : <StudentView />;
}


// -----------------------------
// Vista STUDENT — CRUD + progreso propio
// -----------------------------

function StudentView() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<{ open: boolean; id?: string }>({ open: false });
  const [showView, setShowView] = useState<{ open: boolean; id?: string }>({ open: false });
  const [showProgress, setShowProgress] = useState<{ open: boolean; id?: string }>({ open: false });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.list({ q, status }).then((data) => alive && setItems(data)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, status]);

  async function handleCreate(form: FormState) {
    const created = await api.create({ name: form.name.trim(), description: form.description.trim(), status: form.status, tags: toTags(form.tags) });
    setItems((prev) => [created, ...prev]);
  }
  async function handleUpdate(id: string, form: FormState) {
    const updated = await api.update(id, { name: form.name.trim(), description: form.description.trim(), status: form.status, tags: toTags(form.tags) });
    setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }
  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await api.remove(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <Card title="Mis Proyectos" subtitle="Filtra y crea proyectos">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            <input className="pl-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">Todos</option>
            <option value="in_progress">En curso</option>
            <option value="done">Completado</option>
            <option value="pending">Pendiente</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            {USE_MOCK && <span className="rounded-lg bg-slate-100 px-2 py-1 text-sm text-slate-600">mock/localStorage</span>}
            <Button variant="secondary" onClick={() => setShowCreate(true)}>➕ Nuevo proyecto</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between pb-2 text-sm text-slate-500">
          <span>{loading ? "Cargando…" : `${items.length} proyecto(s)`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Proyecto</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Tags</th>
                <th className="py-2 pr-4">Mi progreso</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-800">
              {items.map((p) => (
                <Row key={p.id} p={p} onView={() => setShowView({ open: true, id: p.id })} onEdit={() => setShowEdit({ open: true, id: p.id })} onDelete={() => handleDelete(p.id)} onProgress={() => setShowProgress({ open: true, id: p.id })} />
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modales CRUD y Progreso */}
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onSubmit={async (data) => { await handleCreate(data); setShowCreate(false); }} />
      <ViewModal ctx={showView} onClose={() => setShowView({ open: false })} />
      <EditModal ctx={showEdit} onClose={() => setShowEdit({ open: false })} onSubmit={async (id, data) => { await handleUpdate(id, data); setShowEdit({ open: false }); }} />
      <ProgressModal ctx={showProgress} onClose={() => setShowProgress({ open: false })} />
    </div>
  );
}

function Row({ p, onView, onEdit, onDelete, onProgress }: { p: Project; onView: () => void; onEdit: () => void; onDelete: () => void; onProgress: () => void }) {
  const [mine, setMine] = useState<ProgressEntry | null>(null);
  useEffect(() => { let alive = true; apiProgress.getMine(p.id).then((x) => alive && setMine(x)); return () => { alive = false; }; }, [p.id]);
  return (
    <tr className="border-t">
      <td className="py-3 pr-4 font-medium">
        <div className="font-semibold">{p.name}</div>
        {p.description && <div className="text-xs text-slate-500 line-clamp-2">{p.description}</div>}
      </td>
      <td className="py-3 pr-4"><StatusChip status={p.status} /></td>
      <td className="py-3 pr-4"><div className="flex flex-wrap gap-2">{p.tags?.map((t, i) => (<Tag key={i}>{t}</Tag>))}</div></td>
      <td className="py-3 pr-4"><div className="flex items-center gap-3"><ProgressBar value={mine?.percent ?? 0} /><span className="w-10 text-right text-xs text-slate-500">{mine?.percent ?? 0}%</span></div></td>
      <td className="py-3"><div className="flex gap-2"><Button variant="ghost" onClick={onView}>Ver</Button><Button variant="subtle" onClick={onEdit}>Editar</Button><Button variant="subtle" onClick={onProgress}>Progreso</Button><Button variant="danger" onClick={onDelete}>Eliminar</Button></div></td>
    </tr>
  );
}

// -----------------------------
// Vista TEACHER — roster de estudiantes y estados
// -----------------------------

function TeacherView() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [modal, setModal] = useState<{ open: boolean; studentId?: string }>({ open: false });

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await apiTeacher.listStudents(q);
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiTeacher
      .listStudents(q)
      .then((data) => {
        if (!alive) return;
        setStudents(data);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q]);

  const filtered = students; // ya filtramos por q en backend; si quieres puedes filtrar otra vez aquí

  return (
    <div className="space-y-6">
      <Card
        title="Estudiantes"
        subtitle="Selecciona a qué alumnos vas a tutorizar y revisa sus proyectos"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔎
            </span>
            <input
              className="pl-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Buscar estudiante…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos los estados</option>
            <option value="in_progress">En curso</option>
            <option value="done">Completado</option>
            <option value="pending">Pendiente</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            {/* Aquí podrías poner algún indicador o botón de refrescar si quieres */}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between pb-2 text-sm text-slate-500">
          <span>{loading ? "Cargando…" : `${filtered.length} estudiante(s)`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Estudiante</th>
                <th className="py-2 pr-4">Proyectos</th>
                <th className="py-2 pr-4">Estados</th>
                <th className="py-2 pr-4">Progreso medio</th>
                <th className="py-2 pr-4">Tutoría</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="align-top text-slate-800">
              {filtered.map((s) => (
                <TeacherRow
                  key={s.id}
                  student={s}
                  statusFilter={statusFilter}
                  onOpen={() =>
                    setModal({ open: true, studentId: s.id })
                  }
                  onToggleAssign={async () => {
                    try {
                      if (s.assigned) {
                        await apiTeacher.unassignStudent(s.id);
                      } else {
                        await apiTeacher.assignStudent(s.id);
                      }
                      await loadStudents();
                    } catch (err) {
                      console.error(err);
                      alert("No se pudo actualizar la tutoría");
                    }
                  }}
                />
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-500"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TeacherStudentProjectsModal
        ctx={modal}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}


function TeacherRow({
  student,
  statusFilter,
  onOpen,
  onToggleAssign,
}: {
  student: TeacherStudent;
  statusFilter: "all" | ProjectStatus;
  onOpen: () => void;
  onToggleAssign: () => void;
}) {
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<ProjectStatus, number>;
    avgProgress: number;
  }>({
    total: 0,
    byStatus: { pending: 0, in_progress: 0, done: 0 },
    avgProgress: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const projects = await api.list({ ownerId: student.id });
      const byStatus = {
        pending: 0,
        in_progress: 0,
        done: 0,
      } as Record<ProjectStatus, number>;
      projects.forEach((p) => {
        byStatus[p.status]++;
      });

      // progreso medio (por ahora sigue usando apiProgress local)
      const progress = await apiProgress.listByUser(student.id);
      const ownProjectIds = new Set(projects.map((p) => p.id));
      const ownEntries = progress.filter((e) =>
        ownProjectIds.has(e.projectId)
      );
      const avg = ownEntries.length
        ? Math.round(
            ownEntries.reduce((a, b) => a + b.percent, 0) /
              ownEntries.length
          )
        : 0;

      if (!alive) return;
      setStats({ total: projects.length, byStatus, avgProgress: avg });
    })();
    return () => {
      alive = false;
    };
  }, [student.id]);

  const visibleTotal =
    statusFilter === "all" ? stats.total : stats.byStatus[statusFilter];

  return (
    <tr className="border-t">
      <td className="py-3 pr-4 font-medium">
        <div className="font-semibold">{student.name}</div>
        <div className="text-xs text-slate-500">{student.email}</div>
      </td>
      <td className="py-3 pr-4">{visibleTotal}</td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span>Pend:</span>
          <span className="font-semibold">{stats.byStatus.pending}</span>
          <span>Curso:</span>
          <span className="font-semibold">{stats.byStatus.in_progress}</span>
          <span>Comp:</span>
          <span className="font-semibold">{stats.byStatus.done}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <ProgressBar value={stats.avgProgress} />
          <span className="w-10 text-right text-xs text-slate-500">
            {stats.avgProgress}%
          </span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex rounded-lg px-2 py-1 text-xs ${
            student.assigned
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {student.assigned ? "Asignado" : "No asignado"}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button
            variant="subtle"
            onClick={onOpen}
            disabled={!student.assigned}
          >
            Ver proyectos
          </Button>
          <Button
            variant={student.assigned ? "danger" : "secondary"}
            onClick={onToggleAssign}
          >
            {student.assigned ? "Dejar de tutorizar" : "Tutorizar"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function TeacherStudentProjectsModal({
  ctx,
  onClose,
}: {
  ctx: { open: boolean; studentId?: string };
  onClose: () => void;
}) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!ctx.open || !ctx.studentId) return;

    setLoading(true);
    api
      .list({ ownerId: ctx.studentId })
      .then((ps) => {
        if (!alive) return;
        setItems(ps);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [ctx.open, ctx.studentId]);

  return (
    <Modal
      open={!!ctx.open}
      onClose={onClose}
      title="Proyectos del estudiante"
    >
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <div className="space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-slate-500">
              El estudiante no tiene proyectos.
            </p>
          )}

          {items.map((p) => (
            <div key={p.id} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="font-semibold">{p.name}</div>
                <StatusChip status={p.status} />
              </div>
              {p.description && (
                <p className="text-slate-700 text-sm">{p.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {p.tags.map((t, i) => (
                  <Tag key={i}>{t}</Tag>
                ))}
              </div>
            </div>
          ))}

          <div className="text-right">
            <Button variant="subtle" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// -----------------------------
// Modales comunes (Student)
// -----------------------------

function CreateModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: FormState) => Promise<void> }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const canSubmit = form.name.trim().length >= 3;

  useEffect(() => { if (!open) setForm(emptyForm); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proyecto">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej. Clasificador de Imágenes" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Estado</label>
            <StatusSelect value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
          </div>
          <div className="grow">
            <label className="mb-1 block text-sm font-medium">Tags (separados por coma)</label>
            <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="IA, Equipo, Docs" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={async () => { if (!canSubmit) return; setBusy(true); try { await onSubmit(form); } finally { setBusy(false); } }} disabled={!canSubmit || busy}>{busy ? "Guardando…" : "Guardar"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ViewModal({ ctx, onClose }: { ctx: { open: boolean; id?: string }; onClose: () => void }) {
  const [item, setItem] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { let alive = true; if (!ctx.open || !ctx.id) return; setLoading(true); api.get(ctx.id!).then((p) => alive && setItem(p)).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, [ctx.open, ctx.id]);

  return (
    <Modal open={ctx.open} onClose={onClose} title="Detalle de proyecto">
      {loading && <p className="text-sm text-slate-500">Cargando…</p>}
      {!loading && item && (
        <div className="space-y-3">
          <div className="flex items-center gap-3"><h4 className="text-lg font-semibold">{item.name}</h4><StatusChip status={item.status} /></div>
          {item.description && <p className="text-slate-700">{item.description}</p>}
          <div className="flex flex-wrap gap-2">{item.tags.map((t, i) => (<Tag key={i}>{t}</Tag>))}</div>
          <div className="text-xs text-slate-400"><div>Creado: {new Date(item.createdAt).toLocaleString()}</div><div>Actualizado: {new Date(item.updatedAt).toLocaleString()}</div></div>
          <div className="pt-2 text-right"><Button variant="subtle" onClick={onClose}>Cerrar</Button></div>
        </div>
      )}
    </Modal>
  );
}

function EditModal({ ctx, onClose, onSubmit }: { ctx: { open: boolean; id?: string }; onClose: () => void; onSubmit: (id: string, data: FormState) => Promise<void> }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { let alive = true; if (!ctx.open || !ctx.id) return; setLoading(true); api.get(ctx.id!).then((p) => { if (!alive) return; setForm({ name: p.name, description: p.description ?? "", status: p.status, tags: fromTags(p.tags) }); }).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, [ctx.open, ctx.id]);

  const canSubmit = form.name.trim().length >= 3;

  return (
    <Modal open={!!ctx.open} onClose={onClose} title="Editar proyecto">
      {loading ? (<p className="text-sm text-slate-500">Cargando…</p>) : (
        <div className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium">Nombre</label><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
          <div><label className="mb-1 block text-sm font-medium">Descripción</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
          <div className="flex items-center gap-3"><div><label className="mb-1 block text-sm font-medium">Estado</label><StatusSelect value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} /></div><div className="grow"><label className="mb-1 block text-sm font-medium">Tags (separados por coma)</label><input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" /></div></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button><Button onClick={async () => { if (!canSubmit || !ctx.id) return; setBusy(true); try { await onSubmit(ctx.id, form); } finally { setBusy(false); } }} disabled={!canSubmit || busy}>{busy ? "Guardando…" : "Guardar"}</Button></div>
        </div>
      )}
    </Modal>
  );
}

// -----------------------------
// Progreso — modal (Student)
// -----------------------------

function ProgressModal({ ctx, onClose }: { ctx: { open: boolean; id?: string }; onClose: () => void }) {
  const [percent, setPercent] = useState<number>(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { let alive = true; if (!ctx.open || !ctx.id) return; setLoading(true); apiProgress.getMine(ctx.id).then((x) => { if (!alive) return; setPercent(x?.percent ?? 0); setNote(x?.note ?? ""); }).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, [ctx.open, ctx.id]);

  return (
    <Modal open={!!ctx.open} onClose={onClose} title="Mi progreso">
      {loading ? (<p className="text-sm text-slate-500">Cargando…</p>) : (
        <div className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium">Porcentaje</label><input type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
          <div><label className="mb-1 block text-sm font-medium">Nota</label><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
          <div className="flex items-center justify-between text-xs text-slate-500"><span>0%</span><div className="grow px-3"><ProgressBar value={percent} /></div><span>100%</span></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button><Button onClick={async () => { if (!ctx.id) return; setBusy(true); try { await apiProgress.upsertMine(ctx.id, { percent, note }); onClose(); } finally { setBusy(false); } }}>{busy ? "Guardando…" : "Guardar"}</Button></div>
        </div>
      )}
    </Modal>
  );
}