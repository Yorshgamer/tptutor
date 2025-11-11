const fs = require("fs");
const bcrypt = require("bcryptjs");
const { loginUser } = require("../controllers/userController");

jest.mock("fs");
jest.mock("bcryptjs");

describe("🔐 loginUser controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const mockUsers = [
    { id: 1, name: "Test", email: "test@mail.com", password: "hashedpass" },
  ];

  test("❌ 400 si faltan credenciales", async () => {
    req.body = {};
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  test("❌ 404 si el usuario no existe", async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify([]));
    req.body = { email: "no@mail.com", password: "123456" };
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Usuario no encontrado." })
    );
  });

  test("❌ 401 si la contraseña es incorrecta", async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
    bcrypt.compare.mockResolvedValue(false);
    req.body = { email: "test@mail.com", password: "wrongpass" };

    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Contraseña incorrecta." })
    );
  });

  test("✅ login exitoso con credenciales válidas", async () => {
    fs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
    bcrypt.compare.mockResolvedValue(true);
    req.body = { email: "test@mail.com", password: "hashedpass" };

    await loginUser(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Inicio de sesión exitoso 🚀",
        user: expect.objectContaining({
          name: "Test",
          email: "test@mail.com",
        }),
      })
    );
  });
});
