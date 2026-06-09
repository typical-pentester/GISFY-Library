import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Students from './pages/Students';
import Books from './pages/Books';
import Library from './pages/Library';

/**
 * Main Application Component
 * 
 * Description: Serves as the root component for the React application. It establishes
 * the routing context (`BrowserRouter`), renders the persistent navigation bar, and
 * maps URLs to their corresponding page components.
 * 
 * Data Flow / Consumers:
 * - This component is rendered into the DOM by `frontend/src/main.jsx`.
 * - The `Routes` component acts as a switch:
 *   - `/students` renders the `<Students />` component.
 *   - `/books` renders the `<Books />` component.
 *   - `/library` renders the `<Library />` component.
 *   - The root `/` path immediately redirects to `/students`.
 */
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
