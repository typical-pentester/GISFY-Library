import React, { useState, useEffect, useRef } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api';

const BACKEND_URL = 'http://localhost:5000';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', className: '', photo: null, video: null });
  const [editingId, setEditingId] = useState(null);

  const fetchStudents = async () => {
    try {
      const res = await getStudents({ page, limit: 25, search, sortBy, sortOrder });
      setStudents(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, sortBy, sortOrder]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('className', formData.className);
    if (formData.photo) data.append('photo', formData.photo);
    if (formData.video) data.append('video', formData.video);

    try {
      if (editingId) {
        await updateStudent(editingId, data);
      } else {
        await createStudent(data);
      }
      handleCancel();
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', className: '', photo: null, video: null });
    setEditingId(null);
    // Reset file inputs
    document.getElementById('photoInput').value = '';
    document.getElementById('videoInput').value = '';
  };

  const handleEdit = (student) => {
    setFormData({ name: student.name, className: student.class, photo: null, video: null });
    setEditingId(student.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(id);
        fetchStudents();
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
        <h2>{editingId ? 'Edit Student' : 'Add Student'}</h2>
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Class</label>
          <input type="text" name="className" value={formData.className} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Photo Attachment</label>
          <input id="photoInput" type="file" name="photo" accept="image/*" onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Video Attachment</label>
          <input id="videoInput" type="file" name="video" accept="video/*" onChange={handleInputChange} />
        </div>
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
        </div>
      </div>

      <div className="table-box">
        <div className="table-header-row">
          <h2>Student Table</h2>
          <div className="search-box">
            {showSearch && (
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search by name..." 
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
              <th onClick={() => handleSort('class')}>Class {sortBy === 'class' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Photo</th>
              <th>Video</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.class}</td>
                <td>
                  {s.photo_url && <img src={`${BACKEND_URL}${s.photo_url}`} alt={s.name} />}
                </td>
                <td>
                  {s.video_url && <video src={`${BACKEND_URL}${s.video_url}`} controls />}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center'}}>No students found</td></tr>
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

export default Students;
