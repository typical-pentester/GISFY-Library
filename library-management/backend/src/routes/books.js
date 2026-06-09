const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET All Books Route
 * 
 * Description: Retrieves a paginated list of books. Supports sorting and searching by name.
 * 
 * Inputs (Query Parameters):
 * - `page`, `limit`: Pagination parameters.
 * - `search`: String to filter the book list by name.
 * - `sortBy`, `sortOrder`: Sorting columns and directions.
 * 
 * Outputs:
 * - JSON response: `{ data: [...books], total, page, totalPages }`.
 * 
 * Data Flow / Consumers:
 * - Consumed by `frontend/src/api.js` (`getBooks()`).
 * - Used by `frontend/src/pages/Books.jsx` to render the books table and manage pagination/sorting.
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
    const offset = (page - 1) * limit;

    const queryParams = [`%${search}%`, limit, offset];
    
    // Whitelist columns and order to prevent SQL injection
    const allowedSortCols = ['id', 'name', 'author', 'pub', 'year'];
    const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
    const sortDir = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const query = `
      SELECT id, name, author, pub, TO_CHAR(year, 'YYYY-MM-DD') as year FROM book 
      WHERE name ILIKE $1 
      ORDER BY ${sortCol} ${sortDir} 
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `SELECT COUNT(*) FROM book WHERE name ILIKE $1`;

    const result = await pool.query(query, queryParams);
    const countResult = await pool.query(countQuery, [`%${search}%`]);
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST Create Book Route
 * 
 * Description: Inserts a new book into the database. Enforces required fields but allows optional ones.
 * 
 * Inputs (JSON body):
 * - `name`, `year`: Required text and date fields.
 * - `author`, `pub`: Optional string fields. If left blank, they are saved as `null`.
 * 
 * Outputs:
 * - JSON representation of the newly created book.
 * 
 * Data Flow / Consumers:
 * - Called via `frontend/src/api.js` (`createBook()`).
 * - Triggered by the "Save" button in `frontend/src/pages/Books.jsx` when creating a new book.
 * - Outputs data to the `book` table in the PostgreSQL DB.
 */
router.post('/', async (req, res) => {
  const { name, author, pub, year } = req.body;

  if (!name || !name.trim() || !author || !author.trim() || !pub || !pub.trim() || !year) {
    return res.status(400).json({ error: 'Name, Author, Publication, and Year are all required.' });
  }

  try {
    const result = await pool.query(
      "INSERT INTO book (name, author, pub, year) VALUES ($1, $2, $3, $4) RETURNING id, name, author, pub, TO_CHAR(year, 'YYYY-MM-DD') as year",
      [name.trim(), author.trim(), pub.trim(), year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT Update Book Route
 * 
 * Description: Updates an existing book's details in the database based on ID.
 * 
 * Inputs (JSON body):
 * - URL Param `id`: ID of the book.
 * - `name`, `year`: Required fields to update.
 * - `author`, `pub`: Optional fields (saved as `null` if empty).
 * 
 * Outputs:
 * - JSON representation of the updated book.
 * 
 * Data Flow / Consumers:
 * - Called via `frontend/src/api.js` (`updateBook()`).
 * - Triggered by the "Save" button in `frontend/src/pages/Books.jsx` when editing an existing book.
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, author, pub, year } = req.body;

  if (!name || !name.trim() || !author || !author.trim() || !pub || !pub.trim() || !year) {
    return res.status(400).json({ error: 'Name, Author, Publication, and Year are all required.' });
  }

  try {
    const result = await pool.query(
      "UPDATE book SET name = $1, author = $2, pub = $3, year = $4 WHERE id = $5 RETURNING id, name, author, pub, TO_CHAR(year, 'YYYY-MM-DD') as year",
      [name.trim(), author.trim(), pub.trim(), year, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE Book Route
 * 
 * Description: Deletes a book record from the database.
 * 
 * Inputs:
 * - URL Param `id`: ID of the book to delete.
 * 
 * Outputs:
 * - JSON success message: `{ message: 'Book deleted successfully' }`
 * 
 * Data Flow / Consumers:
 * - Called via `frontend/src/api.js` (`deleteBook()`).
 * - Triggered by the "Delete" button in the Action column of `frontend/src/pages/Books.jsx`.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM book WHERE id = $1', [id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete: This book is currently referenced in a Library borrowing record.' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;