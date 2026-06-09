const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET all students (with pagination, sorting, search)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
    const offset = (page - 1) * limit;

    const queryParams = [`%${search}%`, limit, offset];
    
    // Whitelist columns and order to prevent SQL injection
    const allowedSortCols = ['id', 'name', 'class'];
    const sortCol = allowedSortCols.includes(sortBy) ? sortBy : 'name';
    const sortDir = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const query = `
      SELECT * FROM student 
      WHERE name ILIKE $1 
      ORDER BY ${sortCol} ${sortDir} 
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `SELECT COUNT(*) FROM student WHERE name ILIKE $1`;

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

// POST add a student
router.post('/', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { name, className } = req.body;
  let photo_url = null;
  let video_url = null;

  if (req.files && req.files['photo']) {
    photo_url = `/uploads/${req.files['photo'][0].filename}`;
  }
  if (req.files && req.files['video']) {
    video_url = `/uploads/${req.files['video'][0].filename}`;
  }

  try {
    const result = await pool.query(
      'INSERT INTO student (name, class, photo_url, video_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, className, photo_url, video_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT edit a student
router.put('/:id', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;
  const { name, className } = req.body;

  try {
    // Get existing to preserve URLs if new ones aren't uploaded
    const existingResult = await pool.query('SELECT * FROM student WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const existing = existingResult.rows[0];

    let photo_url = existing.photo_url;
    let video_url = existing.video_url;

    if (req.files && req.files['photo']) {
      photo_url = `/uploads/${req.files['photo'][0].filename}`;
    }
    if (req.files && req.files['video']) {
      video_url = `/uploads/${req.files['video'][0].filename}`;
    }

    const result = await pool.query(
      'UPDATE student SET name = $1, class = $2, photo_url = $3, video_url = $4 WHERE id = $5 RETURNING *',
      [name, className, photo_url, video_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a student
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM student WHERE id = $1', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
