import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom'; // Import Outlet and Link
import { supabase } from './supabaseClient';
import LoginModal from './LoginModal';
import AdminPanel from './AdminPanel';
import './App.css';

function Layout() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  async function fetchTutors() {
    // We set loading to true here to show feedback on admin actions
    setLoading(true);
    const { data, error } = await supabase.from('tutors').select('*');
    if (error) console.error('Error fetching tutors:', error);
    else setTutors(data);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    fetchTutors();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="App">

      <header>
        <div className="header-content">
          <h1>BHS Tiger Tutors</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/tutors">Find a Tutor</Link>
            <Link to="/group-tutoring">Group Tutoring</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            {!session ? (
              <button onClick={() => setIsLoginModalOpen(true)} className="nav-login-btn">
                Tutor Portal
              </button>
            ) : (
              <>
                <Link to="/edit-profile">My Profile</Link>
                <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
              </>
            )}
          </nav>
        </div>
      </header>

      {session && (
        <AdminPanel
          tutors={tutors}
          onTutorAdded={fetchTutors} // This now refreshes the list
          onSignOut={handleSignOut}
        />
      )}

      <main>
        {/* Outlet renders the active page. We pass tutors/loading as context */}
        <Outlet context={{ tutors, loading }} />
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} BHS Mu Alpha Theta</p>
        {!session ? (
          <button className="admin-login-button" onClick={() => setShowLogin(true)}>
            Admin Login
          </button>
        ) : null}
      </footer>

      {showLogin && (
        <LoginModal
          onLoginSuccess={(session) => {
            setSession(session);
            setShowLogin(false);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

export default Layout;