import pkg from 'pg';
import dotenv from "dotenv";

const { Pool } = pkg;
dotenv.config();

console.log('ENV Check:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: typeof process.env.DB_PASSWORD,
  value: process.env.DB_PASSWORD ? '***hidden***' : 'MISSING',
  database: process.env.DB_NAME,
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;
