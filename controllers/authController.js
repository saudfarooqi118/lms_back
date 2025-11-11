import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

// Create JWT
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Register
export const register = async (request, reply) => {
  const { email, password, name, role } = request.body || {};
  if (!email || !password || !role) {
    return reply.code(400).send({ error: 'Email, password, and role are required' });
  }
  if (!['admin', 'librarian', 'customer'].includes(role)) {
    return reply.code(400).send({ error: 'Invalid role' });
  }

  try {
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, name, created_at`,
      [email, hashed, role, name || null]
    );
    reply.code(201).send({ user: res.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      reply.code(409).send({ error: 'Email already exists' });
    } else {
      console.error(err);
      reply.code(500).send({ error: 'Server error' });
    }
  }
};

// Login
export const login = async (request, reply) => {
  const { email, password } = request.body || {};
  if (!email || !password) return reply.code(400).send({ error: 'Email & password required' });

  try {
    const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (res.rows.length === 0) return reply.code(401).send({ error: 'Invalid credentials' });

    const user = res.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return reply.code(401).send({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    reply.setCookie('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });

    reply.send({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    console.log(`User logged in: ${user.email}`);
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: 'Server error' });
  }
};

// Logout
export const logout = async (request, reply) => {
  reply.clearCookie('token', { path: '/' });
  reply.send({ ok: true });
};

// Get current user
export const me = async (request, reply) => {
  try {
    const token = request.cookies['token'];
    if (!token) return reply.code(401).send({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, JWT_SECRET);
    reply.send({ user: decoded });
  } catch {
    reply.code(401).send({ error: 'Invalid token' });
  }
};
