import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import TutorCard from './TutorCard';
import LoginModal from './LoginModal';   // Import the modal
import AdminPanel from './AdminPanel';   // Import the admin panel
import './App.css';

function App() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // This is the function we'll pass to the AdminPanel
  async function fetchTutors() {
    setLoading(true);
    const { data, error } = await supabase.from('tutors').select('*');
    if (error) console.error('Error fetching tutors:', error);
    else setTutors(data);
    setLoading(false);
  }

  // Check for existing session on page load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    fetchTutors();
  }, []); // Runs once on load

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="App">

      {/* Show Admin Panel if logged in */}
      {session && (
        <AdminPanel
          tutors={tutors}
          onTutorAdded={fetchTutors}  // Pass the fetch function
          onSignOut={handleSignOut}
        />
      )}

      <h1>Meet the Tutors</h1>

      {loading && <p style={{ textAlign: 'center' }}>Loading Tutors...</p>}

      <div className="tutor-grid">
        {tutors.map(tutor => (
          <TutorCard
            key={tutor.id}
            name={tutor.name}
            subjects={tutor.subjects}
            photo={tutor.photo}
            bookingLink={tutor.bookingLink}
          />
        ))}
      </div>

      <footer>
        {/* Show "Admin" button if NOT logged in, otherwise null */}
        {!session ? (
          <button className="admin-login-button" onClick={() => setShowLogin(true)}>
            Admin
          </button>
        ) : null}
      </footer>

      {/* Show Login Modal if showLogin is true */}
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

export default App;