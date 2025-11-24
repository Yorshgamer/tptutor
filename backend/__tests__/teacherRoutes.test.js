/**
 * __tests__/teacherRoutes.test.js
 * Cobertura Objetivo: 100% Statements, Branches, Functions, Lines
 */

import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// ==========================================
// 1. MOCKS
// ==========================================

// Mock Models
jest.mock("../models/User.js", () => ({
  User: {
    find: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("../models/TutorAssignment.js", () => ({
  TutorAssignment: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

// Mock Auth Middleware dinámico
// Usamos una variable global 'mockUser' que podemos alterar en cada test
let mockUser = { id: "teacher_1", role: "teacher" };

jest.mock("../routes/authRoutes.js", () => ({
  auth: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

// ==========================================
// 2. SETUP
// ==========================================
let teacherRoutes;
let User, TutorAssignment;
let app;

describe("🍎 /api/teacher Routes", () => {
  beforeAll(async () => {
    // Import dinámico de modelos
    const userMod = await import("../models/User.js");
    User = userMod.User;

    const tutorMod = await import("../models/TutorAssignment.js");
    TutorAssignment = tutorMod.TutorAssignment;

    // Import dinámico de rutas
    const routeMod = await import("../routes/teacherRoutes.js");
    teacherRoutes = routeMod.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "teacher_1", role: "teacher" }; // Reset a profesor por defecto
    
    app = express();
    app.use(express.json());
    app.use("/api/teacher", teacherRoutes);
  });

  // =================================================================
  // 1. MIDDLEWARE REQUIRE TEACHER
  // =================================================================
  describe("Middleware: requireTeacher", () => {
    test("🚫 403 si el rol es 'student'", async () => {
      mockUser = { id: "s1", role: "student" };
      const res = await request(app).get("/api/teacher/students");
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("FORBIDDEN");
    });

    test("✅ 200 si el rol es 'teacher' (Rama izquierda del OR)", async () => {
      mockUser = { id: "t1", role: "teacher" };
      // Mock para que pase la lógica del controlador y retorne 200
      User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      TutorAssignment.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

      const res = await request(app).get("/api/teacher/students");
      expect(res.status).toBe(200);
    });

    test("✅ 200 si el rol es 'admin' (Rama derecha del OR)", async () => {
      mockUser = { id: "a1", role: "admin" };
      
      User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      TutorAssignment.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

      const res = await request(app).get("/api/teacher/students");
      expect(res.status).toBe(200);
    });
  });

  // =================================================================
  // 2. GET /students
  // =================================================================
  describe("GET /students", () => {
    // Configuración común de mocks para GET
    const mockStudentsDB = [
      { _id: "s1", name: "Student 1", email: "s1@test.com" }, // Asignado
      { _id: "s2", name: "Student 2", email: "s2@test.com" }, // No asignado
    ];
    // Mock de asignaciones: Teacher 1 tiene asignado a Student 1
    const mockAssignmentsDB = [{ studentId: "s1" }];

    beforeEach(() => {
        User.find.mockReturnValue({ select: jest.fn().mockResolvedValue(mockStudentsDB) });
        TutorAssignment.find.mockReturnValue({ select: jest.fn().mockResolvedValue(mockAssignmentsDB) });
    });

    test("✅ Lista estudiantes y marca 'assigned' correctamente (Sin Query)", async () => {
      const res = await request(app).get("/api/teacher/students");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      
      // Verificar filtro base
      expect(User.find).toHaveBeenCalledWith({ role: "student" });

      // Verificar lógica de asignación (s1 true, s2 false)
      const s1 = res.body.data.find(s => s.id === "s1");
      const s2 = res.body.data.find(s => s.id === "s2");

      expect(s1.assigned).toBe(true);
      expect(s2.assigned).toBe(false);
    });

    test("🔍 Filtra por texto (Query q) y limpia espacios", async () => {
      const query = "  juan  "; // Espacios extra para probar .trim()
      
      await request(app).get(`/api/teacher/students?q=${query}`);

      // Verificar construcción del filtro complejo ($or)
      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
        role: "student",
        $or: [
          { name: expect.any(RegExp) },
          { email: expect.any(RegExp) }
        ]
      }));
    });
  });

  // =================================================================
  // 3. POST /students/:studentId (ASIGNAR)
  // =================================================================
  describe("POST /students/:studentId", () => {
    test("✅ Asigna alumno exitosamente (Upsert)", async () => {
      // Mock alumno existe
      User.findOne.mockResolvedValue({ _id: "s1", role: "student" });
      
      const res = await request(app).post("/api/teacher/students/s1");

      expect(res.status).toBe(201);
      
      // Verificar llamada a upsert
      expect(TutorAssignment.findOneAndUpdate).toHaveBeenCalledWith(
        { teacherId: "teacher_1", studentId: "s1" },
        {},
        expect.objectContaining({ new: true, upsert: true })
      );
    });

    test("🚫 404 si alumno no existe o no tiene rol student", async () => {
      // Mock alumno no encontrado
      User.findOne.mockResolvedValue(null);

      const res = await request(app).post("/api/teacher/students/s99");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("STUDENT_NOT_FOUND");
      
      // No debe intentar asignar
      expect(TutorAssignment.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  // =================================================================
  // 4. DELETE /students/:studentId (DESASIGNAR)
  // =================================================================
  describe("DELETE /students/:studentId", () => {
    test("✅ Desasigna alumno correctamente", async () => {
      TutorAssignment.findOneAndDelete.mockResolvedValue({ _id: "assignment_1" });

      const res = await request(app).delete("/api/teacher/students/s1");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      expect(TutorAssignment.findOneAndDelete).toHaveBeenCalledWith({
        teacherId: "teacher_1",
        studentId: "s1"
      });
    });
  });
});