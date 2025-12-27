import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function Layout({ openLogin }) {
  return (
    <div className="App"> {/* Changed to 'App' to match most standard CSS setups */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">BHS Tutors</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/tutors">Find a Tutor</Link>
            <Link to="/group-tutoring">Group Sessions</Link>
            <button onClick={openLogin} className="login-button">Admin</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>© 2025 BHS Tiger Tutors</p>
        <button onClick={openLogin} className="footer-link">Staff Login</button>
      </footer>
    </div>
  );
}

export default Layout;