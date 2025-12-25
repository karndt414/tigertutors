import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import ImageUpload from './ImageUpload'; 
import EditModal from './EditModal';
import './AdminPanel.css';

function AdminPanel({ tutors, onTutorAdded, onSignOut }) {
    const [name, setName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingTutor, setEditingTutor] = useState(null);

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

    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const { error } = await supabase
            .from('group_sessions')
            .insert([{
                subject: formData.get('subject'),
                tutor_id: formData.get('tutor_id'),
                session_date: formData.get('session_date'),
                zoom_link: formData.get('zoom_link'),
                max_capacity: 10 // or add an input for this
            }]);

        if (error) {
            alert("Error: " + error.message);
        } else {
            alert("Group session scheduled!");
            e.target.reset();
        }
    };

    const handleApprove = async (tutorId) => {
        const { error } = await supabase
            .from('tutors')
            .update({ is_approved: true })
            .eq('id', tutorId);

        if (error) alert(error.message);
        else {
            alert("Tutor approved!");
            onTutorAdded(); // Refresh the list
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

            <h3>Schedule Group Session</h3>
            <form onSubmit={handleGroupSubmit}>
                <input type="text" placeholder="Session Subject" name="subject" required />

                <select name="tutor_id" required>
                    <option value="">Select a Tutor</option>
                    {tutors.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                <input type="datetime-local" name="session_date" required />
                <input type="text" placeholder="Meeting Link (Zoom/Teams)" name="zoom_link" />

                <button type="submit">Schedule Session</button>
            </form>

            <h3>Manage Tutors</h3>
            <div className="tutor-manage-list">
                {tutors.map(tutor => (
                    <div key={tutor.id} className="tutor-manage-item">
                        <span>{tutor.name}</span>
                        <div className="tutor-manage-buttons"> {/* 4. Add a wrapper div */}
                            <button
                                onClick={() => setEditingTutor(tutor)} // 5. Set the tutor to edit
                                className="edit-button"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(tutor.id)}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h3>Pending Approvals</h3>
            <div className="vetting-list">
                {tutors.filter(t => !t.is_approved).map(tutor => (
                    <div key={tutor.id} className="tutor-manage-item">
                        <span>{tutor.name} ({tutor.subjects})</span>
                        <button
                            onClick={() => handleApprove(tutor.id)}
                            className="edit-button"
                            style={{ backgroundColor: '#28a745' }}
                        >
                            Approve
                        </button>
                    </div>
                ))}
            </div>

            {/* --- RENDER THE MODAL (it's hidden by default) --- */}
            {/* 6. Add the modal component here */}
            <EditModal
                tutor={editingTutor}
                onClose={() => setEditingTutor(null)}
                onUpdated={onTutorAdded} // This re-fetches the tutor list
            />
        </div>
    );
}

export default AdminPanel;