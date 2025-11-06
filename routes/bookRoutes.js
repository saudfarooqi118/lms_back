import {
  getAllBooks,
  addBook,
  deleteBook,
  issueBook,
  updateBook,
  returnBook,
  fetchIssuedBooks,
  getIssuedBooksByUser,
} from "../controllers/bookController.js";
import { requireRole } from "../controllers/roleMiddleware.js";

async function bookRoutes(fastify) {
  fastify.get("/", { preHandler: requireRole(["admin", "librarian"]) }, getAllBooks);
  fastify.post("/", { preHandler: requireRole(["admin" , "librarian"]) }, addBook);
  fastify.put("/:id", { preHandler: requireRole(["admin", "librarian"])}, updateBook);
  fastify.delete("/:id", { preHandler: requireRole(["admin"]) }, deleteBook);
  fastify.post("/issue", { preHandler: requireRole(["librarian"]) }, issueBook);
  fastify.post('/return', { preHandler: requireRole(["librarian"]) }, returnBook);
  fastify.get("/fetchissued", { preHandler: requireRole(["admin", "librarian"]) }, fetchIssuedBooks);
  fastify.get('/issuedbooks/:user_id', getIssuedBooksByUser);
}

export default bookRoutes;
