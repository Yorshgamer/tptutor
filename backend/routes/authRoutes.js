// routes/authRoutes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "teacher"]).optional().default("student"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(payload) {
  // REFACTOR: Extraemos la variable para que el Branch Coverage sea explícito
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en .env");
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

export async function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const parts = hdr.split(" ");
  const token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
  
  if (!token) return res.status(401).json({ ok: false, error: "NO_TOKEN" });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "INVALID_TOKEN" });
  }
}

router.post("/register", async (req, res) => {
  try {
    // REFACTOR: Extraemos la lógica del rol fuera del objeto de configuración.
    // Esto elimina la complejidad del Optional Chaining (?.) dentro del ternario.
    // req.body siempre es un objeto (gracias a express.json()), pero protegemos el acceso.
    const rawRole = req.body && req.body.role;
    const normalizedRole = typeof rawRole === "string" ? rawRole.toLowerCase() : undefined;

    const data = registerSchema.parse({
      ...req.body,
      role: normalizedRole,
    });

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ ok:false, error:"EMAIL_IN_USE", message:"El correo ya está en uso" });
    
    const safeRole = (data.role === "teacher" || data.role === "student") ? data.role : "student";

    const passwordHash = await User.hashPassword(data.password, Number(process.env.BCRYPT_ROUNDS || 12));
    const user = await User.create({ email: data.email, name: data.name, passwordHash, role: safeRole });

    let token;
    try {
      token = signToken({ sub: user._id.toString(), role: user.role });
    } catch (e) {
      // Si falla el token, borramos el usuario (Rollback manual)
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ ok:false, error:"SERVER_TOKEN", message:"No se pudo crear la sesión" });
    }

    return res.status(201).json({
      ok: true,
      message: "Usuario registrado correctamente",
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    if (err.errors || err.issues) {
      return res.status(400).json({ ok:false, error:"VALIDATION", message:"Datos inválidos", detail: err });
    }
    console.error(err);
    return res.status(500).json({ ok:false, error:"SERVER", message:"Error interno" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    const valid = await user.checkPassword(password);
    if (!valid) return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.json({
      ok: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    if (err.errors || err.issues) return res.status(400).json({ ok: false, error: "VALIDATION", detail: err });
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER" });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("_id name email role createdAt");
  res.json({ ok: true, data: user });
});

export default router;