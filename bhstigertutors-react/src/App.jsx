import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import TutorCard from './TutorCard';
import LoginModal from './LoginModal';
import AdminPanel from './AdminPanel';
import './App.css'; // Your new styles

function App() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  async function fetchTutors() {
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
        <h1>BHS Tiger Tutors</h1>
      </header>

      {/* Admin Panel now appears in its own section */}
      {session && (
        <AdminPanel
          tutors={tutors}
          onTutorAdded={fetchTutors}
          onSignOut={handleSignOut}
        />
      )}

      <main>
        {/* Changed this to an h2 for better structure */}
        <h2>Meet the Tutors</h2>

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
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} BHS Mu Alpha Theta</p>
        {!session ? (
          <button className="admin-login-button" onClick={() => setShowLogin(true)}>
            Admin Login
          </button>
        ) : null}
      </footer>

      {/* Login Modal remains the same */}
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