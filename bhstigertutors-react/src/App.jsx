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
import LearnerProfilePage from './pages/LearnerProfilePage';
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
                    <Route path="/learner-profile" element={
                        <ProtectedLearnerRoute>
                            <LearnerProfilePage />
                        </ProtectedLearnerRoute>
                    } />
                    {user && userRole === 'admin' && <Route path="admin" element={<AdminPanel tutors={tutors} onTutorAdded={fetchTutors} onSignOut={handleSignOut} />} />}
                </Route>
            </Routes>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
}

// Create a protected route component
function ProtectedLearnerRoute({ children }) {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setUserRole(data?.role);
            }
            setLoading(false);
        };

        checkRole();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (userRole !== 'learner') {
        return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--accent-danger)' }}>
            Access denied. This page is for learners only.
        </p>;
    }

    return children;
}

export default App;