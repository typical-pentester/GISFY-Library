const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const studentsRouter = require('./routes/students');
const booksRouter = require('./routes/books');
const libraryRouter = require('./routes/library');

/**
 * Main Express Application Entry Point
 * 
 * Description: Initializes the Express application, configures middleware (CORS, JSON body parsing),
 * sets up static file serving for uploaded media, and mounts the API route handlers.
 * 
 * Data Flow / Consumers:
 * - Listens on `PORT` (default 5000) for incoming HTTP requests from the React frontend (specifically from `frontend/src/api.js`).
 * - Static file serving: Maps `/uploads` URL path to the local `backend/uploads` directory so the frontend can display uploaded images and videos.
 * - Route Mounting: Directs all `/api/students` requests to `studentsRouter`, `/api/books` to `booksRouter`, and `/api/library` to `libraryRouter`.
 */
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically so the frontend can access media URLs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount sub-routers for handling specific API endpoints
app.use('/api/students', studentsRouter);
app.use('/api/books', booksRouter);
app.use('/api/library', libraryRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));