require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

async function seed() {
  const users = [
    { email: 'admin@local', password: 'AdminPass123!', role: 'admin', name: 'Main Admin' },
    { email: 'librarian@local', password: 'LibPass123!', role: 'librarian', name: 'Head Librarian' },
    { email: 'customer@local', password: 'CustPass123!', role: 'customer', name: 'Sample Customer' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, BCRYPT_SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.email, hash, u.role, u.name]
    );
    console.log(`Seeded user: ${u.email}`);
  }

  process.exit(0);
}

seed();
