import {
  getAllUsers,
  addUser,
} from '../controllers/userController.js';
import { requireRole } from '../controllers/roleMiddleware.js';

export default async function userRoutes(fastify) {
  // Admin only
  fastify.get('/users', { preHandler: requireRole(['admin']) }, getAllUsers);
  fastify.post('/users/add', addUser);
}
