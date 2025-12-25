import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Layout({ session, openLogin }) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-container">
      {/* NAVIGATION HEADER */}
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>BHS Tiger Tutors</Link>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/tutors">Find a Tutor</Link>
          <Link to="/group-tutoring">Group Sessions</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>

          {!session ? (
            <button onClick={openLogin} className="nav-login-btn">
              Tutor Portal
            </button>
          ) : (
            <>
              {/* Only show "My Profile" to logged in tutors */}
              <Link to="/edit-profile">My Profile</Link>
              <button onClick={handleLogout} className="logout-btn">
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="content">
        <Outlet />
      </main>

      {/* THE FOOTER (Add your old footer code here) */}
      <footer className="footer">
        <p>© 2024 BHS Tiger Tutors. All rights reserved.</p>
        <button onClick={openLogin} className="admin-link">Admin Login</button>
      </footer>
    </div>
  );
}

export default Layout;