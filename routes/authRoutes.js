import * as authController from '../controllers/authController.js';

export default async function authRoutes(fastify) {
  fastify.post('/auth/register', authController.register);
  fastify.post('/auth/login', authController.login);
  fastify.post('/auth/logout', authController.logout);
  fastify.get('/auth/me', authController.me);
}
