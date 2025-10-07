const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const usersPath = path.join(__dirname, "../data/users.json");

// 🔹 Utilidad para leer/escribir JSON local
const readUsers = () => JSON.parse(fs.readFileSync(usersPath, "utf8"));
const writeUsers = (data) => fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));

// 🔹 POST /api/users/register
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Todos los campos son obligatorios." });

  const users = readUsers();

  const exists = users.find((u) => u.email === email);
  if (exists) return res.status(409).json({ error: "El correo ya está registrado." });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), name, email, password: hashed };
  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ message: "Usuario registrado con éxito ✅", user: { name, email } });
};

// 🔹 POST /api/users/login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Debe ingresar correo y contraseña." });

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Contraseña incorrecta." });

  res.json({ message: "Inicio de sesión exitoso 🚀", user: { name: user.name, email: user.email } });
};
