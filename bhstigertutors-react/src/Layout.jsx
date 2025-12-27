import React from 'react';
import { Outlet, Link } from 'react-router-dom';

function Layout({ openLogin }) {
  return (
    <div className="App"> {/* Changed to 'App' to match most standard CSS setups */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">Tiger Tutors</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/tutors">Tutors</Link>
            <Link to="/sessions">Sessions</Link>
          </div>
          <button onClick={openLogin} className="login-button">Login</button>
        </div>
      </nav>

      <div className="main-content">
        <Outlet />
      </div>

      <footer className="footer">
        <p>&copy; 2025 Tiger Tutors. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;