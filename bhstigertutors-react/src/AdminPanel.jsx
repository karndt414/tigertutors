import React, { useState, useEffect } from 'react';
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
    const [sessions, setSessions] = useState([]);
    const [registrations, setRegistrations] = useState([]);

    useEffect(() => {
        fetchSessions();
        fetchRegistrations();
    }, []);

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

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('group_sessions')
            .select('*')
            .order('session_date', { ascending: true });
        
        if (error) console.error(error);
        else setSessions(data || []);
    };

    const fetchRegistrations = async () => {
        const { data, error } = await supabase
            .from('registrations')
            .select(`
                *,
                group_sessions ( subject, session_date, tutors ( name ) )
            `)
            .order('registered_at', { ascending: false });
        
        if (error) console.error(error);
        else setRegistrations(data || []);
    };

    const handleDeleteRegistration = async (registrationId) => {
        if (!window.confirm('Remove this registration?')) return;

        const { error } = await supabase
            .from('registrations')
            .delete()
            .eq('id', registrationId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Registration removed');
            fetchRegistrations();
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

            <hr />

            <h3>Session Registrations</h3>
            <div className="registrations-container">
                {sessions.length === 0 ? (
                    <p>No sessions scheduled yet.</p>
                ) : (
                    sessions.map(session => {
                        const sessionRegs = registrations.filter(r => r.session_id === session.id);
                        return (
                            <div key={session.id} className="session-registration-card">
                                <h4>{session.subject}</h4>
                                <p><strong>When:</strong> {new Date(session.session_date).toLocaleString()}</p>
                                <p><strong>Total Registered:</strong> <span className="reg-count">{sessionRegs.length}</span></p>
                                
                                {sessionRegs.length > 0 ? (
                                    <div className="registrations-list">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Registered</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sessionRegs.map(reg => (
                                                    <tr key={reg.id}>
                                                        <td>{reg.user_email}</td>
                                                        <td>{new Date(reg.registered_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <button 
                                                                onClick={() => handleDeleteRegistration(reg.id)}
                                                                className="delete-button"
                                                                style={{ fontSize: '0.8em', padding: '4px 8px' }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>No registrations yet</p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <hr />

            <h3>Manage Tutors</h3>
            <div className="tutor-manage-list">
                {tutors.map(tutor => (
                    <div key={tutor.id} className="tutor-manage-item">
                        <span>{tutor.name}</span>
                        <div className="tutor-manage-buttons">
                            <button
                                onClick={() => setEditingTutor(tutor)}
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

            <EditModal
                tutor={editingTutor}
                onClose={() => setEditingTutor(null)}
                onUpdated={onTutorAdded}
            />
        </div>
    );
}

export default AdminPanel;