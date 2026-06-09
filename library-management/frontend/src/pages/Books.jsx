import React, { useState, useEffect, useRef } from 'react';
import { getBooks, createBook, updateBook, deleteBook } from '../api';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', author: '', pub: '', year: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchBooks = async () => {
    try {
      const res = await getBooks({ page, limit: 25, search, sortBy, sortOrder });
      setBooks(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, search, sortBy, sortOrder]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateBook(editingId, formData);
      } else {
        await createBook(formData);
      }
      handleCancel();
      fetchBooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', author: '', pub: '', year: '' });
    setEditingId(null);
  };

  const handleEdit = (book) => {
    setFormData({ 
      name: book.name, 
      author: book.author, 
      pub: book.pub, 
      year: book.year ? book.year.split('T')[0] : '' 
    });
    setEditingId(book.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBook(id);
        fetchBooks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    } else {
      setSearch('');
    }
  };

  return (
    <div className="page-container">
      <div className="form-box">
        <h2>{editingId ? 'Edit Book' : 'Add Book'}</h2>
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Author</label>
          <input type="text" name="author" value={formData.author} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Publication</label>
          <input type="text" name="pub" value={formData.pub} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Date / Year</label>
          <input type="date" name="year" value={formData.year} onChange={handleInputChange} />
        </div>
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
        </div>
      </div>

      <div className="table-box">
        <div className="table-header-row">
          <h2>Book Table</h2>
          <div className="search-box">
            {showSearch && (
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search by book name..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              />
            )}
            <button className="btn btn-secondary" onClick={toggleSearch}>
              {showSearch ? 'Close Search' : 'Search'}
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('author')}>Author {sortBy === 'author' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('pub')}>Publication {sortBy === 'pub' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('year')}>Year {sortBy === 'year' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.author}</td>
                <td>{b.pub}</td>
                <td>{b.year ? new Date(b.year).toLocaleDateString() : ''}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={() => handleEdit(b)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>No books found</td></tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i} 
                className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                onClick={() => setPage(i + 1)}
              >
                Page {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Books;
