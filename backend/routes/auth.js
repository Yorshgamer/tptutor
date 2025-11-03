import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8) // mínimo razonable
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ ok: false, error: 'EMAIL_IN_USE' });

    const passwordHash = await (User).hashPassword(data.password);
    const user = await User.create({ email: data.email, name: data.name, passwordHash });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.status(201).json({ ok: true, data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) {
    if (err.errors || err.issues) return res.status(400).json({ ok:false, error:'VALIDATION', detail: err });
    res.status(500).json({ ok:false, error:'SERVER' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok:false, error:'INVALID_CREDENTIALS' });

    const valid = await user.checkPassword(password);
    if (!valid) return res.status(401).json({ ok:false, error:'INVALID_CREDENTIALS' });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.json({ ok: true, data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
  } catch (err) {
    if (err.errors || err.issues) return res.status(400).json({ ok:false, error:'VALIDATION', detail: err });
    res.status(500).json({ ok:false, error:'SERVER' });
  }
});

// Middleware de auth para proteger rutas
export function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const parts = hdr.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
  if (!token) return res.status(401).json({ ok:false, error:'NO_TOKEN' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ ok:false, error:'INVALID_TOKEN' });
  }
}

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('_id name email role createdAt');
  res.json({ ok:true, data: user });
});

export default router;