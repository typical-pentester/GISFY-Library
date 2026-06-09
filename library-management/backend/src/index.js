const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const studentsRouter = require('./routes/students');
const booksRouter = require('./routes/books');
const libraryRouter = require('./routes/library');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/students', studentsRouter);
app.use('/api/books', booksRouter);
app.use('/api/library', libraryRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));