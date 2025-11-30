import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import ImageUpload from './ImageUpload'; // 1. Import the new component
import './AdminPanel.css';

function AdminPanel({ tutors, onTutorAdded, onSignOut }) {
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    // 2. We'll use this to store the URL from the ImageUpload component
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 4. Add a check to make sure photo is uploaded
        if (!photoUrl) {
            alert('Please upload a photo for the tutor.');
            return;
        }

        setLoading(true);

        // 5. Use 'photoUrl' in your insert object
        const { error } = await supabase
            .from('tutors')
            .insert([{ name, subjects, photo: photoUrl}]);

        if (error) {
            alert('Error adding tutor: ' + error.message);
        } else {
            alert('Tutor added!');
            // Clear the form
            setName('');
            setSubjects('');
            setPhotoUrl(''); // Clear the photo URL
            onTutorAdded(); // Refreshes the lists
            // We can't easily clear the preview in the child,
            // but it will be gone if the user reloads. This is fine for now.
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
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Subjects (e.g., Calc AB, Physics)" value={subjects} onChange={(e) => setSubjects(e.target.value)} required />

                {/* 3. Replace the old photo input with your new component */}
                <ImageUpload
                    onUpload={(url) => setPhotoUrl(url)}
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Tutor'}
                </button>
            </form>

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
        </div>
    );
}

export default AdminPanel;