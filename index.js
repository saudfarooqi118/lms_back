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
    origin: 'http://localhost:3000', // your Next.js app
    credentials: true,               // allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});
await app.register(fastifyCookie, {
    secret: process.env.JWT_SECRET, // optional for signed cookies
});

// Register routes
await app.register(authRoutes);
await app.register(userRoutes);
await app.register(bookRoutes, { prefix: "/api/books" });

// Start server
const start = async () => {
    try {
        await app.listen({ port: process.env.PORT || 4000 });
        console.log(`🚀 Server running on http://localhost:${process.env.PORT || 4000}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
