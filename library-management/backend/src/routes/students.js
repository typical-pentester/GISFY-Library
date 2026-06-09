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

/**
 * Multer Storage Configuration
 * 
 * Description: Configures how uploaded files (photos and videos) are stored on the disk.
 * It determines the destination folder and generates a unique filename to prevent overwrites.
 * 
 * Inputs:
 * - `req`: The HTTP request object.
 * - `file`: The file being uploaded.
 * 
 * Outputs / Data Flow:
 * - Saves the physical file to `backend/uploads/`.
 * - The generated filename is later combined with `/uploads/` to form a URL string.
 * - This URL string is saved to the PostgreSQL database by the POST/PUT routes below.
 */
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

/**
 * GET All Students Route
 * 
 * Description: Fetches a paginated, sorted, and filtered list of students from the database.
 * 
 * Inputs (Query Parameters):
 * - `page`, `limit`: Pagination controls.
 * - `search`: String to filter students by name.
 * - `sortBy`, `sortOrder`: Sorting controls.
 * 
 * Outputs:
 * - JSON object containing: `{ data: [...students], total, page, totalPages }`.
 * 
 * Data Flow / Consumers:
 * - Consumed by `frontend/src/api.js` (`getStudents()`).
 * - Ultimately powers the main data table and pagination controls in `frontend/src/pages/Students.jsx`.
 */
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

/**
 * POST Create Student Route
 * 
 * Description: Creates a new student record and handles optional photo/video uploads.
 * 
 * Inputs (FormData):
 * - `name`, `className`: Text fields required for the student.
 * - `photo`, `video`: Optional multipart file uploads.
 * 
 * Outputs:
 * - JSON representation of the newly created student record.
 * 
 * Data Flow / Consumers:
 * - Called by `frontend/src/api.js` (`createStudent()`).
 * - Triggered when the user clicks the "Save" button in `frontend/src/pages/Students.jsx` (if creating a new record).
 * - Generates file paths that are sent to the `student` table in the database.
 */
router.post('/', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { name, className } = req.body;

  if (!name || !name.trim() || !className || !className.trim()) {
    return res.status(400).json({ error: 'Name and Class are required.' });
  }

  if (!req.files || !req.files['photo'] || !req.files['video']) {
    return res.status(400).json({ error: 'Photo and Video files are both required when adding a new student.' });
  }

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

/**
 * PUT Update Student Route
 * 
 * Description: Updates an existing student's text details and replaces media files if new ones are uploaded.
 * 
 * Inputs (FormData):
 * - URL Param `id`: The ID of the student to update.
 * - `name`, `className`: Updated text fields.
 * - `photo`, `video`: Optional new multipart file uploads.
 * 
 * Outputs:
 * - JSON representation of the updated student record.
 * 
 * Data Flow / Consumers:
 * - Called by `frontend/src/api.js` (`updateStudent()`).
 * - Triggered by the "Save" button in `frontend/src/pages/Students.jsx` when editing an existing record.
 */
router.put('/:id', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;
  const { name, className } = req.body;

  if (!name || !name.trim() || !className || !className.trim()) {
    return res.status(400).json({ error: 'Name and Class are required.' });
  }

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

/**
 * DELETE Student Route
 * 
 * Description: Removes a student record from the database by ID.
 * 
 * Inputs:
 * - URL Param `id`: The ID of the student to delete.
 * 
 * Outputs:
 * - JSON success message: `{ message: 'Student deleted successfully' }`
 * 
 * Data Flow / Consumers:
 * - Called by `frontend/src/api.js` (`deleteStudent()`).
 * - Triggered by the "Delete" button in the Action column of the table in `frontend/src/pages/Students.jsx`.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM student WHERE id = $1', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete: This student is currently referenced in a Library borrowing record.' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
