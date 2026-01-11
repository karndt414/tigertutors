import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Layout({ openLogin, onSignOut, user, userRole, tutors, loading }) {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">Tiger Tutors</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            {/* <Link to="/tutors">Find Tutors</Link> */}
            <Link to="/group-tutoring">Sessions</Link>
            <Link to="/contact">Contact</Link>
            {user && userRole === 'tutor' && <Link to="/tutor-profile">Tutor Profile</Link>}
            {user && userRole === 'admin' && <Link to="/tutor-profile">Tutor Profile</Link>}
            {user && userRole === 'learner' && <Link to="/learner-profile">My Profile</Link>}
            {user && userRole === 'admin' && <Link to="/admin">Admin</Link>}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                  {user.email}
                </span>
                <button onClick={onSignOut} className="login-button" style={{ backgroundColor: 'var(--accent-danger)' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={openLogin} className="login-button">
                Login
              </button>
            )}
          </div>
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