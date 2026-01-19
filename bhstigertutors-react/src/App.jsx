import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import ErrorPopup from './components/ErrorPopup';

function App() {
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isErrorPopupOpen, setIsErrorPopupOpen] = useState(false);

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
        if (user) {
            fetchUserRole();
        }
    }, [user]);

    async function fetchUserRole() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('No user logged in');
                setUserRole('learner');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching role:', error.message);
                setUserRole('learner');
                return;
            }

            console.log('✅ Role fetched:', data?.role);
            setUserRole(data?.role || 'learner');
        } catch (err) {
            console.error('Fetch error:', err);
            setUserRole('learner');
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
        navigate('/'); 
    };

    // Make error handler globally available
    useEffect(() => {
        window.showError = () => setIsErrorPopupOpen(true);
    }, []);

    if (authLoading) {
        return <p style={{ textAlign: 'center', padding: '50px' }}>Loading...</p>;
    }

    return (
        <>
            <ErrorPopup isOpen={isErrorPopupOpen} onClose={() => setIsErrorPopupOpen(false)} />
            <Routes>
                <Route path="/" element={<Layout openLogin={() => setIsLoginModalOpen(true)} tutors={tutors} loading={loading} onSignOut={handleSignOut} user={user} userRole={userRole} />}>
                    <Route index element={<HomePage />} />
                    {/* <Route path="tutors" element={<FindTutorPage tutors={tutors} loading={loading} />} /> */}
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="group-tutoring" element={<GroupTutoring />} />
                    <Route path="tutor-profile" element={
                        <ProtectedTutorRoute>
                            <TutorProfilePage />
                        </ProtectedTutorRoute>
                    } />
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

// Create a protected route component for tutors (and admins)
function ProtectedTutorRoute({ children }) {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setUserRole(data.role);
                }
            } catch (err) {
                console.error('Role check failed:', err);
            } finally {
                setLoading(false);
            }
        };

        checkRole();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (userRole !== 'tutor' && userRole !== 'admin') {
        return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--accent-danger)' }}>
            Access denied. This page is for tutors only.
        </p>;
    }

    return children;
}

// Create a protected route component for learners
function ProtectedLearnerRoute({ children }) {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setUserRole(data.role);
                }
            } catch (err) {
                console.error('Role check failed:', err);
            } finally {
                setLoading(false);
            }
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