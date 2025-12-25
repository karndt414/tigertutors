import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Make sure this import exists
import Layout from './Layout';
import HomePage from './pages/HomePage';
import FindTutorPage from './pages/FindTutorPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import GroupTutoring from './pages/GroupTutoring';
import LoginModal from './LoginModal'; // Import your Modal
import './App.css';

function App() {
    // 1. The "Master Switch" for the modal
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    // 2. State to track if someone is logged in
    const [session, setSession] = useState(null);

    // 3. Listen for login/logout changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <>
            <Routes>
                {/* 4. Pass session and the "open" function to Layout */}
                <Route path="/" element={
                    <Layout
                        session={session}
                        openLogin={() => setIsLoginModalOpen(true)}
                    />
                }>
                    <Route index element={<HomePage />} />
                    <Route path="tutors" element={<FindTutorPage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="group-tutoring" element={<GroupTutoring />} />
                </Route>
            </Routes>

            {/* 5. Place the Modal here at the root level */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
}

export default App;