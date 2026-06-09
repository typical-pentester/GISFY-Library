import React, { useState, useEffect, useRef } from 'react';
import { getLibrary, createLibrary, updateLibrary, deleteLibrary, getStudents, getBooks } from '../api';

const Library = () => {
  const [library, setLibrary] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  const [studentsList, setStudentsList] = useState([]);
  const [booksList, setBooksList] = useState([]);

  const [formData, setFormData] = useState({ student_id: '', book_id: '', start_date: '', end_date: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchLibrary = async () => {
    try {
      const res = await getLibrary({ page, limit: 25, search, sortBy, sortOrder });
      setLibrary(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const sRes = await getStudents({ limit: 10000 });
      const bRes = await getBooks({ limit: 10000 });
      setStudentsList(sRes.data.data);
      setBooksList(bRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateLibrary(editingId, formData);
      } else {
        await createLibrary(formData);
      }
      handleCancel();
      fetchLibrary();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({ student_id: '', book_id: '', start_date: '', end_date: '' });
    setEditingId(null);
  };

  const handleEdit = (lib) => {
    setFormData({ 
      student_id: lib.student_id, 
      book_id: lib.book_id, 
      start_date: lib.start_date ? lib.start_date.split('T')[0] : '', 
      end_date: lib.end_date ? lib.end_date.split('T')[0] : '' 
    });
    setEditingId(lib.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteLibrary(id);
        fetchLibrary();
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
        <h2>{editingId ? 'Edit Library Record' : 'Add Library Record'}</h2>
        <div className="form-group">
          <label>Student Name</label>
          <select name="student_id" value={formData.student_id} onChange={handleInputChange}>
            <option value="">Select a student</option>
            {studentsList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Book Name</label>
          <select name="book_id" value={formData.book_id} onChange={handleInputChange}>
            <option value="">Select a book</option>
            {booksList.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} />
        </div>
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
        </div>
      </div>

      <div className="table-box">
        <div className="table-header-row">
          <h2>Library Table</h2>
          <div className="search-box">
            {showSearch && (
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search by book/student..." 
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
              <th onClick={() => handleSort('student_name')}>Student Name {sortBy === 'student_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('book_name')}>Book Name {sortBy === 'book_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('start_date')}>Start Date {sortBy === 'start_date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('end_date')}>End Date {sortBy === 'end_date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {library.map(l => (
              <tr key={l.id}>
                <td>{l.student_name}</td>
                <td>{l.book_name}</td>
                <td>{l.start_date ? new Date(l.start_date).toLocaleDateString() : ''}</td>
                <td>{l.end_date ? new Date(l.end_date).toLocaleDateString() : ''}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={() => handleEdit(l)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(l.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {library.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>No library records found</td></tr>
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

export default Library;
