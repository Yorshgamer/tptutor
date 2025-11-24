/**
 * __tests__/projectRoutes.test.js
 *
 * Pruebas para routes/projectRoutes.js
 */

import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

// MOCK modelos y auth
jest.mock("../models/Project.js", () => ({ Project: {
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
}}));
jest.mock("../models/TutorAssignment.js", () => ({ TutorAssignment: { find: jest.fn() } }));

// Mock del módulo authRoutes (solo la función auth) para controlar req.user
jest.mock("../routes/authRoutes.js", () => {
  return {
    auth: (req, res, next) => {
      // Por defecto inyectamos user student; tests pueden sobrescribir con header override
      const headerUser = req.headers["x-test-user"];
      if (headerUser) {
        // esperar valor JSON stringificado { id, role }
        try {
          req.user = JSON.parse(headerUser);
        } catch {
          req.user = { id: headerUser, role: "student" };
        }
      } else {
        req.user = { id: "u_student", role: "student" };
      }
      return next();
    },
  };
});

const { Project } = await import("../models/Project.js");
const { TutorAssignment } = await import("../models/TutorAssignment.js");
const projectRouter = (await import("../routes/projectRoutes.js")).default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/projects", projectRouter);
  return app;
}

describe("projectRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/projects - estudiante => solo sus proyectos", async () => {
    const app = makeApp();
    Project.find.mockResolvedValue([{ _id: "p1", ownerId: "u_student", name: "P1" }]);

    const res = await request(app)
      .get("/api/projects");

    expect(res.status).toBe(200);
    expect(Project.find).toHaveBeenCalledWith({ ownerId: "u_student" });
    expect(res.body.data).toHaveLength(1);
  });

  test("GET /api/projects - teacher con all=1 => devuelve proyectos de estudiantes asignados", async () => {
    const app = makeApp();
    // Configurar auth como teacher por header
    // TutorAssignment.find devuelve links con studentId
    TutorAssignment.find.mockResolvedValue([{ studentId: "s1" }, { studentId: "s2" }]);
    // Project.find con $in
    Project.find.mockResolvedValue([{ _id: "p1", ownerId: "s1" }]);

    const res = await request(app)
      .get("/api/projects?all=1")
      .set("x-test-user", JSON.stringify({ id: "t1", role: "teacher" }));

    // Ver que llamó TutorAssignment
    expect(TutorAssignment.find).toHaveBeenCalledWith({ teacherId: "t1" });
    expect(Project.find).toHaveBeenCalledWith({ ownerId: { $in: ["s1", "s2"] } });
    expect(res.status).toBe(200);
  });

  test("POST /api/projects - crea proyecto con ownerId del usuario", async () => {
    const app = makeApp();
    Project.create.mockResolvedValue({ _id: "new", name: "Nuevo", ownerId: "u_student" });

    const res = await request(app)
      .post("/api/projects")
      .send({ name: "Nuevo", description: "desc", tags: [] });

    expect(res.status).toBe(201);
    expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Nuevo", ownerId: "u_student" }));
  });

  test("GET /api/projects/:id - not found -> 404", async () => {
    const app = makeApp();
    Project.findOne.mockResolvedValue(null);

    const res = await request(app).get("/api/projects/doesnot");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });

  test("PATCH /api/projects/:id - actualiza y devuelve 404 si no existe", async () => {
    const app = makeApp();
    Project.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app).patch("/api/projects/p1").send({ name: "x" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });

  test("DELETE /api/projects/:id - 404 si ya no existe", async () => {
    const app = makeApp();
    Project.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app).delete("/api/projects/p1");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });
});
