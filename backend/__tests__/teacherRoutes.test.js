/**
 * __tests__/teacherRoutes.test.js
 *
 * Pruebas para routes/teacherRoutes.js
 */

import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

jest.mock("../models/User.js", () => ({ User: { find: jest.fn(), findOne: jest.fn() } }));
jest.mock("../models/TutorAssignment.js", () => ({ TutorAssignment: { find: jest.fn(), findOneAndUpdate: jest.fn(), findOneAndDelete: jest.fn() } }));

// Mock auth (como teacher)
jest.mock("../routes/authRoutes.js", () => ({
  auth: (req, res, next) => {
    // permitir override por header
    const headerUser = req.headers["x-test-user"];
    if (headerUser) {
      try { req.user = JSON.parse(headerUser); } catch { req.user = { id: headerUser, role: "teacher" }; }
    } else {
      req.user = { id: "t1", role: "teacher" };
    }
    return next();
  },
}));

const { User } = await import("../models/User.js");
const { TutorAssignment } = await import("../models/TutorAssignment.js");
const teacherRouter = (await import("../routes/teacherRoutes.js")).default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/teacher", teacherRouter);
  return app;
}

describe("teacherRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/teacher/students - devuelve lista con assigned flags", async () => {
    const app = makeApp();
    User.find.mockResolvedValue([{ _id: "s1", name: "A", email: "a@x" }, { _id: "s2", name: "B", email: "b@x" }]);
    TutorAssignment.find.mockResolvedValue([{ studentId: "s1" }]);

    const res = await request(app).get("/api/teacher/students");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.find(d => d.id === "s1").assigned).toBe(true);
    expect(res.body.data.find(d => d.id === "s2").assigned).toBe(false);
  });

  test("POST /api/teacher/students/:studentId - asigna estudiante (201)", async () => {
    const app = makeApp();
    User.findOne.mockResolvedValue({ _id: "s1", role: "student" });
    TutorAssignment.findOneAndUpdate.mockResolvedValue({});

    const res = await request(app).post("/api/teacher/students/s1");

    expect(res.status).toBe(201);
    expect(TutorAssignment.findOneAndUpdate).toHaveBeenCalled();
  });

  test("POST /api/teacher/students/:studentId - 404 si student no existe", async () => {
    const app = makeApp();
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post("/api/teacher/students/notexist");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("STUDENT_NOT_FOUND");
  });

  test("DELETE /api/teacher/students/:studentId - elimina y devuelve ok", async () => {
    const app = makeApp();
    TutorAssignment.findOneAndDelete.mockResolvedValue({});

    const res = await request(app).delete("/api/teacher/students/s1");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(TutorAssignment.findOneAndDelete).toHaveBeenCalledWith({ teacherId: "t1", studentId: "s1" });
  });
});
