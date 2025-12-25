import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Destructure the props we passed from App.jsx
function Layout({ session, openLogin }) {
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="app-container">
            <nav className="navbar">
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/tutors">Find a Tutor</Link>
                    <Link to="/group-tutoring">Group Sessions</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                </div>

                <div className="nav-auth">
                    {!session ? (
                        // This button now calls the function from App.jsx!
                        <button onClick={openLogin} className="nav-login-btn">
                            Tutor Portal
                        </button>
                    ) : (
                        <div className="logged-in-nav">
                            {/* You can add a Link to /edit-profile here later */}
                            <button onClick={handleLogout} className="logout-btn">
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main className="content">
                <Outlet /> {/* This renders your pages */}
            </main>
        </div>
    );
}

export default Layout;