import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './AdminPanel.css'; // We'll create this

// onTutorAdded is just the fetchTutors function from App.jsx
function AdminPanel({ onTutorAdded, onSignOut }) {
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [photo, setPhoto] = useState('');
    const [bookingLink, setBookingLink] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('tutors')
            .insert([{ name, subjects, photo, bookingLink }]);

        if (error) {
            alert('Error adding tutor: ' + error.message);
        } else {
            alert('Tutor added!');
            // Clear the form
            setName('');
            setSubjects('');
            setPhoto('');
            setBookingLink('');
            // Trigger a re-fetch of the tutor list in App.jsx
            onTutorAdded();
        }
        setLoading(false);
    };

    return (
        <div className="admin-panel">
            <h2>Admin Panel <button onClick={onSignOut} className="signout-button">Log Out</button></h2>
            <h3>Add New Tutor</h3>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Subjects (e.g., Calc AB, Physics)" value={subjects} onChange={(e) => setSubjects(e.target.value)} required />
                <input type="text" placeholder="Photo URL" value={photo} onChange={(e) => setPhoto(e.target.value)} />
                <input type="text" placeholder="Calendly Booking Link" value={bookingLink} onChange={(e) => setBookingLink(e.target.value)} required />
                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Tutor'}
                </button>
            </form>
        </div>
    );
}

export default AdminPanel;