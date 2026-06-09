const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all library records (with pagination, sorting, search)
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
        l.start_date, 
        l.end_date 
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

// POST add a library record
router.post('/', async (req, res) => {
  const { student_id, book_id, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO library (student_id, book_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, book_id, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit a library record
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { student_id, book_id, start_date, end_date } = req.body;

  try {
    const result = await pool.query(
      'UPDATE library SET student_id = $1, book_id = $2, start_date = $3, end_date = $4 WHERE id = $5 RETURNING *',
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

// DELETE a library record
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
