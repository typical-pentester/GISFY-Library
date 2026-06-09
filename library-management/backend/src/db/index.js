const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Database Connection Pool
 * 
 * Description: Initializes a connection pool to the PostgreSQL database using environment variables.
 * A connection pool is used to manage multiple simultaneous database connections efficiently.
 * 
 * Inputs:
 * - Reads DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD from the `backend/.env` file.
 * 
 * Data Flow / Consumers:
 * - This `pool` instance is exported and consumed by ALL backend route files 
 *   (`src/routes/students.js`, `src/routes/books.js`, `src/routes/library.js`).
 * - Those route files use `pool.query()` to execute SQL statements and send the JSON results to the frontend.
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;