import axios from 'axios';

/**
 * Axios Instance Configuration
 * 
 * Description: Sets up the base HTTP client for all backend communication.
 * 
 * Data Flow / Consumers:
 * - Directs all requests to the backend server at `http://localhost:5000/api`.
 * - This instance is used by all the exported helper functions below.
 */
const API_URL = 'http://localhost:5000/api';
export const api = axios.create({
  baseURL: API_URL
});

/**
 * Students API
 * 
 * Data Flow / Consumers:
 * - Exported and consumed exclusively by `frontend/src/pages/Students.jsx`.
 * - `getStudents` passes `params` (page, search, etc.) to backend `GET /api/students`.
 * - `createStudent` & `updateStudent` send `FormData` (for files) to `POST/PUT /api/students`.
 */
export const getStudents = (params) => api.get('/students', { params });
export const createStudent = (data) => api.post('/students', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateStudent = (id, data) => api.put(`/students/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteStudent = (id) => api.delete(`/students/${id}`);

/**
 * Books API
 * 
 * Data Flow / Consumers:
 * - Exported and consumed exclusively by `frontend/src/pages/Books.jsx`.
 * - Interacts with `GET/POST/PUT/DELETE /api/books` on the backend.
 * - `getBooks` is also consumed by `Library.jsx` to fetch the list of books for the dropdown menu!
 */
export const getBooks = (params) => api.get('/books', { params });
export const createBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);

/**
 * Library API
 * 
 * Data Flow / Consumers:
 * - Exported and consumed exclusively by `frontend/src/pages/Library.jsx`.
 * - Interacts with `GET/POST/PUT/DELETE /api/library` on the backend to manage borrowing records.
 */
export const getLibrary = (params) => api.get('/library', { params });
export const createLibrary = (data) => api.post('/library', data);
export const updateLibrary = (id, data) => api.put(`/library/${id}`, data);
export const deleteLibrary = (id) => api.delete(`/library/${id}`);
