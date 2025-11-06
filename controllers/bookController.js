import pool from "../config/db.js";


export const getAllBooks = async (request, reply) => {
  try {
    const { page = 1, limit = 10, search = '' } = request.query;
    const offset = (page - 1) * limit;

    const searchQuery = `
      SELECT * FROM books
      WHERE title ILIKE $1 OR author ILIKE $1
      ORDER BY id
      LIMIT $2 OFFSET $3
    `;

    const { rows: books } = await pool.query(searchQuery, [`%${search}%`, limit, offset]);
    const { rows: totalCount } = await pool.query(
      `SELECT COUNT(*) FROM books WHERE title ILIKE $1 OR author ILIKE $1`,
      [`%${search}%`]
    );

    reply.send({
      books,
      totalPages: Math.ceil(totalCount[0].count / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: 'Failed to fetch books' });
  }
};


// ✅ Add a new book
export const addBook = async (request, reply) => {
  const { title, author, isbn, quantity } = request.body;
  if (!title || !author || !isbn || !quantity)
    return reply.code(400).send({ error: "All fields are required" });

  try {
    const result = await pool.query(
      "INSERT INTO books (title, author, isbn, quantity) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, author, isbn, quantity]
    );
    reply
      .code(201)
      .send({ message: "Book added successfully", book: result.rows[0] });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Failed to add book" });
  }
};

// ✅ Edit / Update an existing book
export const updateBook = async (request, reply) => {
  const { id } = request.params;
  const { title, author, isbn, quantity } = request.body;

  if (!title || !author || !isbn || !quantity)
    return reply.code(400).send({ error: "All fields are required" });

  try {
    const result = await pool.query(
      `UPDATE books 
       SET title = $1, author = $2, isbn = $3, quantity = $4 
       WHERE id = $5 RETURNING *`,
      [title, author, isbn, quantity, id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: "Book not found" });
    }

    reply.send({
      message: "Book updated successfully",
      book: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Failed to update book" });
  }
};

// ✅ Delete a book
export const deleteBook = async (request, reply) => {
  const { id } = request.params;
  try {
    await pool.query("DELETE FROM books WHERE id = $1", [id]);
    reply.send({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Failed to delete book" });
  }
};

// ✅ Issue a book to user
export const issueBook = async (request, reply) => {
  const { book_id, user_id } = request.body;
  try {
    // Check availability
    const check = await pool.query("SELECT quantity FROM books WHERE id = $1", [
      book_id,
    ]);
    if (check.rows.length === 0)
      return reply.code(404).send({ error: "Book not found" });
    if (check.rows[0].quantity <= 0)
      return reply.code(400).send({ error: "Book not available" });

    await pool.query("BEGIN");
    await pool.query("UPDATE books SET quantity = quantity - 1 WHERE id = $1", [
      book_id,
    ]);
    await pool.query(
      "INSERT INTO issued_books (book_id, user_id, issued_at) VALUES ($1, $2, NOW())",
      [book_id, user_id]
    );
    await pool.query("COMMIT");

    reply.send({ message: "Book issued successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    reply.code(500).send({ error: "Failed to issue book" });
  }
};

// ✅ Return a book
export const returnBook = async (request, reply) => {
  const { issue_id } = request.body; // issued_books record ID

  try {
    // Check if the book is issued and not yet returned
    const result = await pool.query(
      "SELECT book_id FROM issued_books WHERE id = $1 AND returned_at IS NULL",
      [issue_id]
    );

    if (result.rows.length === 0)
      return reply.code(404).send({ error: "Book not found or already returned" });

    const bookId = result.rows[0].book_id;

    await pool.query("BEGIN");
    await pool.query("UPDATE books SET quantity = quantity + 1 WHERE id = $1", [bookId]);
    await pool.query("UPDATE issued_books SET returned_at = NOW() WHERE id = $1", [issue_id]);
    await pool.query("COMMIT");

    reply.send({ message: "Book returned successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    reply.code(500).send({ error: "Failed to return book" });
  }
};

// ✅ Fetch all issued books (raw data)
export const fetchIssuedBooks = async (request, reply) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        book_id,
        user_id,
        issued_at,
        returned_at
      FROM issued_books
      ORDER BY issued_at DESC`
    );

    reply.send(result.rows);
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Failed to fetch issued books" });
  }
};


export const getIssuedBooksByUser = async (request, reply) => {
  try {
    const { user_id } = request.params;

    if (!user_id) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    const result = await pool.query(
      `SELECT 
          ib.id,
          ib.book_id,
          ib.user_id,
          b.title,
          b.author,
          ib.issued_at,
          ib.returned_at
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       WHERE ib.user_id = $1
       ORDER BY ib.issued_at DESC`,
      [user_id]
    );

    reply.send(result.rows);
  } catch (error) {
    console.error("❌ Error fetching issued books:", error.message);
    reply.code(500).send({ error: "Failed to fetch issued books" });
  }
};