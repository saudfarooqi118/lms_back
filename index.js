import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';

dotenv.config();

const app = Fastify({ logger: true });

// Register middlewares
await app.register(cors, {
  origin: [
    'http://localhost:3000',           // local frontend
    'https://lmsfrontvercel.vercel.app' // deployed frontend
  ],
  credentials: true,               // allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
await app.register(fastifyCookie, {
  secret: process.env.JWT_SECRET, // optional for signed cookies
});

// Register routes
await app.register(authRoutes);
await app.register(userRoutes);
await app.register(bookRoutes, { prefix: "/api/books" });

app.get('/', async (request, reply) => {
  return { status: 'Backend is running ✅' };
});

app.options('/*', async (req, reply) => {
  reply
    .header('Access-Control-Allow-Origin', req.headers.origin || '*')
    .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    .header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    .header('Access-Control-Allow-Credentials', 'true')
    .send();
});

// Start server
const start = async () => {
  try {
    const PORT = process.env.PORT || 4000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
