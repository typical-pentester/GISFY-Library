import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Students from './pages/Students';
import Books from './pages/Books';
import Library from './pages/Library';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h1>Library Management System</h1>
          <div className="nav-links">
            <Link to="/students" className="nav-link">Students</Link>
            <Link to="/books" className="nav-link">Books</Link>
            <Link to="/library" className="nav-link">Library</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/students" replace />} />
            <Route path="/students" element={<Students />} />
            <Route path="/books" element={<Books />} />
            <Route path="/library" element={<Library />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
