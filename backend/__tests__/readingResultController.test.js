/**
 * Tests for controllers/readingResultController.js
 *
 * Ubícalo en: backend/__tests__/readingResultController.test.js
 */

import { jest } from "@jest/globals";

// Mock Mongoose models and n8n utils
jest.mock("../models/Project.js", () => {
  return { Project: { findById: jest.fn(), findByIdAndUpdate: jest.fn() } };
});
jest.mock("../models/ReadingActivity.js", () => {
  return { ReadingActivity: { findById: jest.fn(), create: jest.fn(), countDocuments: jest.fn() } };
});
jest.mock("../models/ReadingResult.js", () => {
  return { ReadingResult: { create: jest.fn(), distinct: jest.fn() } };
});
jest.mock("../models/User.js", () => {
  return { User: { findById: jest.fn() } };
});
jest.mock("../utils/n8nClient.js", () => {
  return { notifyReadingCompleted: jest.fn() };
});

const { Project } = await import("../models/Project.js");
const { ReadingActivity } = await import("../models/ReadingActivity.js");
const { ReadingResult } = await import("../models/ReadingResult.js");
const { User } = await import("../models/User.js");
const { notifyReadingCompleted } = await import("../utils/n8nClient.js");

const { createReadingResult } = await import("../controllers/readingResultController.js");

// Helper res
function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("readingResultController.createReadingResult", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 404 when project not found", async () => {
    const req = { body: { projectId: "p1", activityId: "a1", mcScore: 10, openScore: 10, rawText: "x" }, user: { id: "u1" } };
    Project.findById.mockResolvedValue(null);

    const res = makeRes();

    await createReadingResult(req, res);

    expect(Project.findById).toHaveBeenCalledWith("p1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "PROJECT_NOT_FOUND" });
  });

  test("returns 403 when project owner mismatch", async () => {
    const req = { body: { projectId: "p1", activityId: "a1", mcScore: 10, openScore: 10, rawText: "x" }, user: { id: "u2" } };
    // project ownerId is u1, request has u2 -> forbidden
    Project.findById.mockResolvedValue({ _id: "p1", ownerId: "u1" });
    User.findById.mockResolvedValue({ _id: "u2", name: "Student" });

    const res = makeRes();

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "FORBIDDEN_PROJECT" });
  });

  test("creates activity if missing, creates result, recalculates progress and notifies when passed", async () => {
    const req = {
      body: { projectId: "p1", activityId: "a1", mcScore: 18, openScore: 16, rawText: "texto", answers: {} },
      user: { id: "u1" },
    };
    // project owner is u1 -> ok
    Project.findById.mockResolvedValue({ _id: "p1", ownerId: "u1" });
    User.findById.mockResolvedValue({ _id: "u1", name: "Alumno" });

    // activity not found -> create it
    ReadingActivity.findById.mockResolvedValue(null);
    ReadingActivity.create.mockResolvedValue({ _id: "a1", projectId: "p1", title: "Lectura 1", minScore: 14 });

    // ReadingResult.create -> return result
    ReadingResult.create.mockResolvedValue({
      activityId: "a1",
      projectId: "p1",
      studentId: "u1",
      mcScore: 18,
      openScore: 16,
      totalScore: 17,
      passed: true,
    });

    // For recalcProjectProgress:
    // totalActivities = countDocuments
    ReadingActivity.countDocuments.mockResolvedValue(3);
    // passed activities distinct -> returns 2 (so completedActivities=2)
    ReadingResult.distinct.mockResolvedValue(["a1", "a2"]);
    Project.findByIdAndUpdate.mockResolvedValue(true);

    const res = makeRes();

    await createReadingResult(req, res);

    // Assert create called for activity
    expect(ReadingActivity.create).toHaveBeenCalled();

    // Assert result created
    expect(ReadingResult.create).toHaveBeenCalledWith(expect.objectContaining({
      activityId: "a1",
      projectId: "p1",
      studentId: "u1",
      mcScore: 18,
      openScore: 16,
    }));

    // Assert notifyReadingCompleted called because passed === true
    expect(notifyReadingCompleted).toHaveBeenCalled();

    // Response 201 with data.result and progress
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.ok).toBe(true);
    expect(jsonArg.data).toHaveProperty("result");
    expect(jsonArg.data).toHaveProperty("progress");
  });

  test("creates result when not passed and does not notify", async () => {
    const req = {
      body: { projectId: "p1", activityId: "a1", mcScore: 6, openScore: 6, rawText: "texto" },
      user: { id: "u1" },
    };
    Project.findById.mockResolvedValue({ _id: "p1", ownerId: "u1" });
    User.findById.mockResolvedValue({ _id: "u1", name: "Alumno" });

    ReadingActivity.findById.mockResolvedValue({ _id: "a1", minScore: 14 });
    ReadingResult.create.mockResolvedValue({ passed: false });

    ReadingActivity.countDocuments.mockResolvedValue(2);
    ReadingResult.distinct.mockResolvedValue([]);
    Project.findByIdAndUpdate.mockResolvedValue(true);

    const res = makeRes();

    await createReadingResult(req, res);

    expect(ReadingResult.create).toHaveBeenCalled();
    expect(notifyReadingCompleted).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.ok).toBe(true);
    expect(jsonArg.data).toHaveProperty("result");
  });

  test("returns 400 on validation error (zod)", async () => {
    const req = { body: { /* invalid body */ }, user: { id: "u1" } };
    const res = makeRes();

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.ok).toBe(false);
    expect(body.error).toBe("VALIDATION");
    expect(body).toHaveProperty("issues");
  });

  test("returns 500 on unexpected error", async () => {
    const req = { body: { projectId: "p1", activityId: "a1", mcScore: 10, openScore: 10, rawText: "x" }, user: { id: "u1" } };
    Project.findById.mockRejectedValue(new Error("DB crash"));
    const res = makeRes();

    await createReadingResult(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "SERVER" });
  });
});
