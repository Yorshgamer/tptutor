const fs = require("fs");
const bcrypt = require("bcryptjs");
const { registerUser } = require("../controllers/userController");

jest.mock("fs");
jest.mock("bcryptjs");

describe("🧾 registerUser controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("❌ 400 si faltan campos al registrar", async () => {
    req.body = { name: "John" };
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  test("❌ 409 si el correo ya existe", async () => {
    fs.readFileSync.mockReturnValue(
      JSON.stringify([{ email: "test@mail.com" }])
    );
    req.body = { name: "John", email: "test@mail.com", password: "123456" };
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "El correo ya está registrado." })
    );
  });

  test("✅ crea usuario nuevo correctamente", async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify([]));
    fs.writeFileSync.mockImplementation(() => {});
    bcrypt.hash.mockResolvedValue("hashed123");

    req.body = { name: "Ana", email: "ana@mail.com", password: "123456" };
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        user: expect.objectContaining({ email: "ana@mail.com" }),
      })
    );
  });
});
