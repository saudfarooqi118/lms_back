import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT
export async function authMiddleware(request, reply) {
  const token = request.cookies['token'];
  if (!token) return reply.code(401).send({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

// Require specific roles
export function requireRole(roles) {
  return async function (request, reply) {
    await authMiddleware(request, reply);
    if (reply.sent) return;
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden: insufficient role' });
    }
  };
}
