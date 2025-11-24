import { jest } from "@jest/globals";

// Mock modules
jest.mock("../models/ReadingActivity.js", () => {
  return {
    ReadingActivity: {
      create: jest.fn(),
      find: jest.fn(),
    },
  };
});

const { ReadingActivity } = await import("../models/ReadingActivity.js");
const {
  createReadingActivity,
  listReadingActivities,
} = await import("../controllers/readingActivityController.js");

// Helper para mock de res
function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("readingActivityController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createReadingActivity - success -> returns 201 and created activity", async () => {
    // Arrange
    const req = {
      body: {
        projectId: "proj1",
        activityId: "act1",
        title: "Actividad 1",
        minScore: 12,
      },
    };
    const created = {
      _id: "act1",
      projectId: "proj1",
      title: "Actividad 1",
      minScore: 12,
    };
    ReadingActivity.create.mockResolvedValue(created);

    const res = makeRes();

    // Act
    await createReadingActivity(req, res);

    // Assert
    expect(ReadingActivity.create).toHaveBeenCalledWith({
      _id: "act1",
      projectId: "proj1",
      title: "Actividad 1",
      minScore: 12,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: created,
    });
  });

  test("createReadingActivity - validation error -> returns 400 with issues", async () => {
    const req = { body: { /* missing required fields */ } };
    const res = makeRes();

    await createReadingActivity(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.ok).toBe(false);
    expect(jsonArg.error).toBe("VALIDATION");
    expect(jsonArg).toHaveProperty("issues");
  });

  test("listReadingActivities - without projectId -> returns list", async () => {
    const req = { query: {} };
    const items = [
      { _id: "a1", projectId: "proj1", title: "t1" },
      { _id: "a2", projectId: "proj2", title: "t2" },
    ];
    ReadingActivity.find.mockResolvedValue(items);

    const res = makeRes();

    await listReadingActivities(req, res);

    expect(ReadingActivity.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: items });
  });

  test("listReadingActivities - with projectId -> applies filter", async () => {
    const req = { query: { projectId: "proj1" } };
    const items = [{ _id: "a1", projectId: "proj1", title: "t1" }];
    ReadingActivity.find.mockResolvedValue(items);

    const res = makeRes();

    await listReadingActivities(req, res);

    expect(ReadingActivity.find).toHaveBeenCalledWith({ projectId: "proj1" });
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: items });
  });

  test("listReadingActivities - DB error -> returns 500", async () => {
    const req = { query: {} };
    ReadingActivity.find.mockRejectedValue(new Error("DB FAIL"));
    const res = makeRes();

    await listReadingActivities(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: "SERVER" });
  });
});
