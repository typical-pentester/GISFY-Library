const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all books (with pagination, sorting, search)
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
      SELECT * FROM book 
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

// POST add a book
router.post('/', async (req, res) => {
  const { name, author, pub, year } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO book (name, author, pub, year) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, author, pub, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit a book
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, author, pub, year } = req.body;

  try {
    const result = await pool.query(
      'UPDATE book SET name = $1, author = $2, pub = $3, year = $4 WHERE id = $5 RETURNING *',
      [name, author, pub, year, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a book
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM book WHERE id = $1', [id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;