import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Layout({ openLogin }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      fetchUserRole(user.id);
    }
  };

  const fetchUserRole = async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (data) setUserRole(data.role);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">Tiger Tutors</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/tutors">Tutors</Link>
            <Link to="/group-tutoring">Sessions</Link>
            <Link to="/contact">Contact</Link>
            {user && userRole === 'tutor' && <Link to="/tutor-profile">Tutor Profile</Link>}
            {user && userRole === 'learner' && <Link to="/learner-profile">My Profile</Link>}
            {user && userRole === 'admin' && <Link to="/admin">Admin</Link>}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                  {user.email}
                </span>
                <button onClick={handleSignOut} className="login-button" style={{ backgroundColor: 'var(--accent-danger)' }}>
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