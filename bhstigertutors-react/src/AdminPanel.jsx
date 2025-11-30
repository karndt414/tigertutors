import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './AdminPanel.css';

// 1. Accept 'tutors' as a prop
function AdminPanel({ tutors, onTutorAdded, onSignOut }) {

    // ... (all your existing useState hooks for the form are fine)
    const [name, setName] = useState('');
    // ...
    const [loading, setLoading] = useState(false);

    // ... (your existing handleSubmit function is fine)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('tutors')
            .insert([{ name, subjects, photo, bookingLink }]);

        if (error) {
            // This line is now fixed (it's a '+' not a '(')
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

    // 2. Add the new handleDelete function
    const handleDelete = async (tutorId) => {
        // Add a simple confirmation
        if (!window.confirm('Are you sure you want to delete this tutor?')) {
            return; // Stop if the user clicks "Cancel"
        }

        // This will only work because you're authenticated
        const { error } = await supabase
            .from('tutors')
            .delete()
            .eq('id', tutorId); // .eq means "where id equals tutorId"

        if (error) {
            alert('Error deleting tutor: ' + error.message);
        } else {
            alert('Tutor deleted.');
            onTutorAdded(); // This is your fetchTutors function, so it refreshes the list
        }
    };

    // 3. Update the JSX to render the list
    return (
        <div className="admin-panel">
            <h2>Admin Panel <button onClick={onSignOut} className="signout-button">Log Out</button></h2>

            <h3>Add New Tutor</h3>
            <form onSubmit={handleSubmit}>
                {/* ... (all your form inputs) ... */}
                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Tutor'}
                </button>
            </form>

            {/* --- ADD THIS NEW SECTION --- */}
            <hr />
            <h3>Manage Tutors</h3>
            <div className="tutor-manage-list">
                {tutors.map(tutor => (
                    <div key={tutor.id} className="tutor-manage-item">
                        <span>{tutor.name}</span>
                        <button
                            onClick={() => handleDelete(tutor.id)}
                            className="delete-button"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
            {/* --- END OF NEW SECTION --- */}

        </div>
    );
}

export default AdminPanel;