import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function Layout({ openLogin }) {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">BHS Tiger Tutors</Link>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/tutors">Find a Tutor</Link>
          <Link to="/group-tutoring">Group Sessions</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <button onClick={openLogin} className="nav-login-btn">Login</button>
        </div>
      </nav>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>© 2024 BHS Tiger Tutors</p>
        <button onClick={openLogin} className="admin-link">Admin Login</button>
      </footer>
    </div>
  );
}

export default Layout;