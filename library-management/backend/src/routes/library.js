const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET All Library Records Route
 * 
 * Description: Retrieves a paginated list of library borrowing records. Uses SQL JOINs 
 * to fetch the actual `student_name` and `book_name` instead of just IDs.
 * 
 * Inputs (Query Parameters):
 * - `page`, `limit`: Pagination parameters.
 * - `search`: String to filter records by student name or book name.
 * - `sortBy`, `sortOrder`: Sorting columns and directions.
 * 
 * Outputs:
 * - JSON response: `{ data: [...libraryRecords], total, page, totalPages }`.
 * 
 * Data Flow / Consumers:
 * - Consumed by `frontend/src/api.js` (`getLibrary()`).
 * - Rendered by `frontend/src/pages/Library.jsx` in the main table to show who borrowed what and when.
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'start_date', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    const queryParams = [`%${search}%`, limit, offset];
    
    // Whitelist columns and order to prevent SQL injection
    const allowedSortCols = {
      'id': 'l.id',
      'student_name': 's.name',
      'book_name': 'b.name',
      'start_date': 'l.start_date',
      'end_date': 'l.end_date'
    };
    
    const sortCol = allowedSortCols[sortBy] || 'l.start_date';
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        l.id, 
        l.student_id, 
        s.name as student_name, 
        l.book_id, 
        b.name as book_name, 
        TO_CHAR(l.start_date, 'YYYY-MM-DD') as start_date, 
        TO_CHAR(l.end_date, 'YYYY-MM-DD') as end_date 
      FROM library l
      JOIN student s ON l.student_id = s.id
      JOIN book b ON l.book_id = b.id
      WHERE b.name ILIKE $1 OR s.name ILIKE $1
      ORDER BY ${sortCol} ${sortDir} 
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM library l
      JOIN student s ON l.student_id = s.id
      JOIN book b ON l.book_id = b.id
      WHERE b.name ILIKE $1 OR s.name ILIKE $1
    `;

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
 * POST Create Library Record Route
 * 
 * Description: Inserts a new library borrowing record into the database. Enforces that the start date
 * must not occur after the end date.
 * 
 * Inputs (JSON body):
 * - `student_id`: Foreign key linking to the `student` table.
 * - `book_id`: Foreign key linking to the `book` table.
 * - `start_date`, `end_date`: Required date fields.
 * 
 * Outputs:
 * - JSON representation of the newly created library record.
 * 
 * Data Flow / Consumers:
 * - Called via `frontend/src/api.js` (`createLibrary()`).
 * - Triggered by the "Save" button in `frontend/src/pages/Library.jsx` when adding a new borrowing record.
 */
router.post('/', async (req, res) => {
  const { student_id, book_id, start_date, end_date } = req.body;
  
  if (!student_id || !book_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Student, Book, Start Date, and End Date are all required.' });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'Start Date must be before or equal to End Date.' });
  }

  try {
    const result = await pool.query(
      "INSERT INTO library (student_id, book_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING id, student_id, book_id, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date",
      [student_id, book_id, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT Update Library Record Route
 * 
 * Description: Updates an existing borrowing record. Enforces start_date <= end_date.
 * 
 * Inputs (JSON body):
 * - URL Param `id`: ID of the library record.
 * - `student_id`, `book_id`, `start_date`, `end_date`: Updated fields.
 * 
 * Outputs:
 * - JSON representation of the updated library record.
 * 
 * Data Flow / Consumers:
 * - Called via `frontend/src/api.js` (`updateLibrary()`).
 * - Triggered by the "Save" button in `frontend/src/pages/Library.jsx` when editing an existing record.
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { student_id, book_id, start_date, end_date } = req.body;

  if (!student_id || !book_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Student, Book, Start Date, and End Date are all required.' });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'Start Date must be before or equal to End Date.' });
  }

  try {
    const result = await pool.query(
      "UPDATE library SET student_id = $1, book_id = $2, start_date = $3, end_date = $4 WHERE id = $5 RETURNING id, student_id, book_id, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date",
      [student_id, book_id, start_date, end_date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Library record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE Library Record Route
 * 
 * Description: Deletes a library borrowing record from the database.
 * 
 * Inputs:
 * - URL Param `id`: ID of the record to delete.
 * 
 * Outputs:
 * - JSON success message: `{ message: 'Library record deleted successfully' }`
 * 
 * Data Flow / Consumers:
 * - Called via `frontend/src/api.js` (`deleteLibrary()`).
 * - Triggered by the "Delete" button in the Action column of `frontend/src/pages/Library.jsx`.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM library WHERE id = $1', [id]);
    res.json({ message: 'Library record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
