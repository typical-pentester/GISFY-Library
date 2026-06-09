import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL
});

export const getStudents = (params) => api.get('/students', { params });
export const createStudent = (data) => api.post('/students', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateStudent = (id, data) => api.put(`/students/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteStudent = (id) => api.delete(`/students/${id}`);

export const getBooks = (params) => api.get('/books', { params });
export const createBook = (data) => api.post('/books', data);
export const updateBook = (id, data) => api.put(`/books/${id}`, data);
export const deleteBook = (id) => api.delete(`/books/${id}`);

export const getLibrary = (params) => api.get('/library', { params });
export const createLibrary = (data) => api.post('/library', data);
export const updateLibrary = (id, data) => api.put(`/library/${id}`, data);
export const deleteLibrary = (id) => api.delete(`/library/${id}`);
