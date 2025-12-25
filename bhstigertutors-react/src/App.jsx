import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout'; // Make sure this points to your Layout file
import HomePage from './pages/HomePage';
import FindTutorPage from './pages/FindTutorPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import GroupTutoring from './pages/GroupTutoring';

function App() {
    return (
        <Routes>
            {/* This Route uses Layout as the "shell" */}
            <Route path="/" element={<Layout />}>
                {/* These child routes render inside the <Outlet> in Layout.jsx */}
                <Route index element={<HomePage />} />
                <Route path="tutors" element={<FindTutorPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="group-tutoring" element={<GroupTutoring />} />
            </Route>
        </Routes>
    );
}

export default App;