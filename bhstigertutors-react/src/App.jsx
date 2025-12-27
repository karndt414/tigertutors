import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import HomePage from './pages/HomePage';
import FindTutorPage from './pages/FindTutorPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import GroupTutoring from './pages/GroupTutoring';
import LoginModal from './LoginModal';
import './App.css';

function App() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <>
            <Routes>
                <Route path="/" element={<Layout openLogin={() => setIsLoginModalOpen(true)} />}>
                    <Route index element={<HomePage />} />
                    <Route path="tutors" element={<FindTutorPage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="group-tutoring" element={<GroupTutoring />} />
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