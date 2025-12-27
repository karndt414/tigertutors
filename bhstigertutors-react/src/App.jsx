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
import { supabase } from './supabaseClient';
import './App.css';

function App() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
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
                    {user && <Route path="admin" element={<AdminPanel tutors={tutors} onTutorAdded={fetchTutors} onSignOut={handleSignOut} />} />}
                </Route>
            </Routes>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
}

export default App;