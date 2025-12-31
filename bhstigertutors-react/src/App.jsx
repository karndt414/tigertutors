import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import HomePage from './pages/HomePage';
import FindTutorPage from './pages/FindTutorPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import GroupTutoring from './pages/GroupTutoring';
import LoginModal from './LoginModal';
import AdminPanel from './AdminPanel';
import TutorProfilePage from './pages/TutorProfilePage';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch tutors from Supabase
    useEffect(() => {
        fetchTutors();
        checkUser();
    }, []);

    async function fetchTutors() {
        const { data, error } = await supabase.from('tutors').select('*');
        if (error) console.error(error);
        else setTutors(data);
        setLoading(false);
    }

    async function checkUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        } catch (error) {
            console.error('Error checking user:', error);
        } finally {
            setAuthLoading(false);
        }
    }

    // Listen for auth changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription?.unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                
                if (data) setUserRole(data.role);
            }
        };
        fetchUserRole();
    }, [user]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
        navigate('/'); 
    };

    if (authLoading) {
        return <p style={{ textAlign: 'center', padding: '50px' }}>Loading...</p>;
    }

    return (
        <>
            <Routes>
                <Route path="/" element={<Layout openLogin={() => setIsLoginModalOpen(true)} tutors={tutors} loading={loading} />}>
                    <Route index element={<HomePage />} />
                    <Route path="tutors" element={<FindTutorPage tutors={tutors} loading={loading} />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="group-tutoring" element={<GroupTutoring />} />
                    <Route path="tutor-profile" element={<TutorProfilePage />} />
                    {user && userRole === 'admin' && <Route path="admin" element={<AdminPanel tutors={tutors} onTutorAdded={fetchTutors} onSignOut={handleSignOut} />} />}
                </Route>
            </Routes>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />

            <nav className="navbar">
                <div className="nav-container">
                    <h1 className="logo">Tiger Tutors</h1>
                    
                    <div className="nav-links">
                        <a href="/">Home</a>
                        {userRole && <a href="/group-tutoring">Group Tutoring</a>}
                        {(userRole === 'tutor' || userRole === 'admin') && <a href="/tutor-profile">Profile</a>}
                        {userRole === 'admin' && <a href="/admin">Admin Panel</a>}
                        {userRole === 'learner' && <a href="/learner-dashboard">Dashboard</a>}
                        {user ? (
                            <>
                                <span className="user-email">{user.email}</span>
                                <button onClick={handleSignOut} className="login-button">Sign Out</button>
                            </>
                        ) : (
                            <button onClick={() => setShowLoginModal(true)} className="login-button">Sign In</button>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}

export default App;