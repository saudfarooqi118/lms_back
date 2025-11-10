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
  origin: (origin, cb) => {
    // allow localhost and your Vercel domain
    const allowedOrigins = [
      'http://localhost:3000',
      'https://lmsfrontvercel.vercel.app',
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // Request from allowed origin
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"));
    }
  },
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
