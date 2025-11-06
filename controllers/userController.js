import pool from '../config/db.js';
import bcrypt from "bcrypt";

// List all users (admin only)
export const getAllUsers = async (request, reply) => {
  try {
    const res = await pool.query(`
      SELECT id, email, role, name, created_at 
      FROM users 
      ORDER BY id DESC
    `);
    reply.send({ users: res.rows });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: 'Server error' });
  }
};

export const addUser = async (request, reply) => {
  try {
    const { email, password, role = "customer", name } = request.body;

    // 🧩 Validation
    if (!email || !password || !name) {
      return reply.code(400).send({ error: "Email, name, and password are required" });
    }

    // 🧩 Check if user already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return reply.code(400).send({ error: "User already exists" });
    }

    // 🔐 Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 🗃️ Insert into DB
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, role, name, created_at`,
      [email, password_hash, role, name]
    );

    reply.code(201).send({ message: "User added successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Error adding user:", err);
    reply.code(500).send({ error: "Failed to add user" });
  }
};

